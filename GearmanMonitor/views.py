from django.shortcuts import render_to_response, redirect, Http404, HttpResponseRedirect
from django.template.context import RequestContext
import gearman
#from django.conf import settings
# from connection import GearmanConnection
from . import DatabaseError
from gearman.errors import ConnectionError
from .models import Server, RefreshRate, ServerHistory
from django.db.models import Min
from .forms import ServerForm
from GearmanMonitor.models import filter_basis_options
import string
import socket

target_servers = {}


def get_connection_str(server_obj):
    return '{0}:{1}'.format(server_obj.host, server_obj.port_no)


def exists(server_id):
    # target_servers.has_key(id) is deprecated use in
    return True if server_id in target_servers else False


def fill_target_servers():
    global target_servers 
    temp = {}
    for server_obj in Server.objects.all():
        if target_servers and server_obj.id in target_servers:
            temp[server_obj.id] = target_servers[server_obj.id]
        else:
            s = get_connection_str(server_obj)
            conn = gearman.GearmanAdminClient([s, ])
            temp[server_obj.id] = {"conn": conn, "server": server_obj, "version": "N/A", "response_time": "N/A"}
    
    target_servers = temp


def fill_target_server(server_id):
    global target_servers

    server_obj = Server.objects.get(pk=server_id)
    if server_obj is None:
        return

    if target_servers and server_obj.id in target_servers:
        return
    else:
        s = get_connection_str(server_obj)
        conn = gearman.GearmanAdminClient([s, ])
        target_servers[server_obj.id] = {"conn": conn, "server": server_obj, "version": "N/A", "response_time": "N/A"}
        return


def servers(request, template="servers.html"):
    global target_servers
    fill_servers_stats()
    auto_ref = get_auto_refresh()
    if auto_ref and auto_ref != -1:
        return render_to_response(template,
                                  {"target_servers": target_servers,  "auto_refresh": auto_ref},
                                  context_instance=RequestContext(request))
    else:
        return render_to_response(template, {"target_servers": target_servers},
                                  context_instance=RequestContext(request))


def server(request, template, server_id=0):

    server_id = get_valid_server_id(int(server_id))
    fill_server_stats(server_id, history_length=50, forceFill=True)

    # version = ""
    # response_time = ""
    #
    # try:
    #     #Retrieves the version number of the Gearman server
    #     version = conn.get_version()
    #     #Sends off a debugging string to execute an application ping on the Gearman server
    #     response_time = conn.ping_server()
    # except ConnectionError:
    #     pass
    #
    # target_servers[server_id]["version"] = version
    # target_servers[server_id]["response_time"] = response_time

    return render_to_response(template, {"target_server": target_servers[server_id]},
                              context_instance=RequestContext(request))
    #return render_to_response(template, {"response_time": response_time, "status":status_response,
    # "version": version, "target_servers":target_servers}, context_instance=RequestContext(request))


def get_auto_refresh():
    auto_refresh = RefreshRate.objects.filter(is_selected=True)
    if len(auto_refresh):
        return auto_refresh[0].rate_value
    else:
        return -1


def get_history(history_lst):
    lst = ()
    for history in history_lst:
        lst1 = ([str(history.created.hour) + ':' + str(history.created.minute) + ':' + str(history.created.second),
                 float(history.response_time)],)
        lst = lst1 + lst
    return lst


def get_down_times(history_lst):
    lstd = ()
    for dhistory in history_lst:
        if dhistory.healthy is False or dhistory.healthy == 0:
            lstd1 = ([str(dhistory.created.hour) + ':'+str(dhistory.created.minute)+':'+str(dhistory.created.second),
                      'gearman was not responding at this time'],)
            lstd = lstd + lstd1
     
    return str(lstd).strip('()').strip(',')


def fill_server_stats(server_id, history_length, forceFill=False):
        version = ""
        response_time = ""
        server_obj = Server(id=server_id)
        health = True

        try:
            socket.setdefaulttimeout(0.5)
            #Retrieves the version number of the Gearman server
            version = target_servers[server_id]["conn"].get_version()
            #Sends off a debugging string to execute an application ping on the Gearman server
            response_time = target_servers[server_id]["conn"].get_server_conn()
            #target_servers[server_id]["conn"].ping_server()

        except ConnectionError:
            health = False
            pass
        except:
            health = False
            pass

        try:
            #saving in history
            history = ServerHistory(server=server_obj, healthy=health,
                                    response_time=0.0 if response_time is None or response_time == '' else response_time
                                    , version=version)
            history.save()
        except DatabaseError:
            pass

        target_servers[server_id]["version"] = version
        target_servers[server_id]["response_time"] = response_time
        history_lst = ServerHistory.objects.filter(server__id=server_id).order_by("-created")[:history_length]
        target_servers[server_id]["history"] = get_history(history_lst)
        target_servers[server_id]["down_times"] = get_down_times(history_lst)


def fill_servers_stats(length=50):
    fill_target_servers()
    global target_servers 
    for server_id in target_servers:
        fill_server_stats(server_id, length)


def schart(request, template="chart_data.html", callback='', server_id=0):
    global target_servers
    try:
        server_id = int(server_id)
    except TypeError:
        raise Http404

    fill_target_server(server_id)
    fill_server_stats(server_id, 10)
    return render_to_response(template, {"target_server": target_servers[server_id], 'cb': callback},
                              context_instance=RequestContext(request))


def get_status(request, template, server_id=0):
    fill_target_servers()
    conn = get_server_conn(request, server_id)
    status_response = ""
    try:
        #Retrieves a list of all registered tasks and reports how many items/workers are in the queue
        status_response = conn.get_status()
    except:
        pass

    target_servers[server_id]["status_response"] = status_response

    return render_to_response(template,
                              {"target_server": target_servers[server_id], "auto_refresh": get_auto_refresh()},
                              context_instance=RequestContext(request))


def add_server(request, template='add_server.html'):
    if request.method == "POST":
        form = ServerForm(data=request.POST)
        if form.is_valid():
            form.save()
            return redirect("servers")
    else:
        form = ServerForm()

    return render_to_response(template, locals(), context_instance=RequestContext(request))


def del_server(request, server_id):
    server_obj = Server.objects.get(pk=server_id)
    server_obj.delete()

    return redirect("servers")


def get_valid_server_id(server_id=None):
    global target_servers
    if len(target_servers) and (server_id is None or server_id == 0 or server_id == ''):
        least_server = Server.objects.all().aggregate(Min("id"))
        server_id = least_server["id__min"]

    server_id = int(server_id)

    if not exists(server_id):
        raise Http404

    return server_id


def get_server_conn(request, server_id=None):
    if server_id is None or server_id == 0 or server_id == '':
        server_id = get_valid_server_id(server_id)
    else:
        server_id = int(server_id)
        if not exists(server_id):
            raise Http404

    return target_servers[server_id]["conn"]


def shutdown(request, server_id, grace=None):
    fill_target_servers()

    conn = get_server_conn(request, server_id)

    if grace is not None and (grace == 'grace' or grace == 'grace/'):
        grace = True
    else:
        grace = False

    conn.send_shutdown(graceful=grace)
    return redirect("servers")


def get_workers(request, template, server_id):
    fill_target_servers()
    conn = get_server_conn(request, server_id)
    workers = None
    err = None
    try:
        socket.setdefaulttimeout(2)
        workers = conn.get_workers()
    except ConnectionError:
        err = "connection error or timeout, we could not get any info from this server, either to check this server or try again later"
        pass
    except:
        err = "something went wrong while getting workers, please make sure there is no connection issue with your server (ping server) or try again later"
        pass


    return render_to_response(template, {"workers": workers, "error": err}, context_instance=RequestContext(request))


def redirect_previous_page(request):
    s = request.GET.get('rurl', None)
    if s or s == '':
        return HttpResponseRedirect(s)
    return redirect("servers")


def refresh(request, rate=-1):

    old_selected = None
    
    try:
        old_selected = RefreshRate.objects.get(is_selected=True)
    except:
        pass

    if rate == '-1' or rate == '':
        if old_selected:
            old_selected.is_selected = False
            old_selected.save()
        return redirect_previous_page(request)
    #redirect to previous visited page
    #return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

    if old_selected and old_selected.rate_value == rate:
        return redirect_previous_page(request)

    if old_selected:
        old_selected.is_selected = False
        old_selected.save()

    target_rate = RefreshRate.objects.get(rate_value=rate)
    target_rate.is_selected = True
    target_rate.save()

    #return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    return redirect_previous_page(request)


def summary(request, template):
    data_length = 10
    fill_servers_stats(data_length)
    global target_servers

    return render_to_response(template, {"target_servers": target_servers, "auto_refresh": get_auto_refresh(), 'length': data_length*1024/50 , "filter": filter_basis_options}, context_instance=RequestContext(request))


def sfilter(request, filter, template):
    lst = string.split(filter, '_', 2)
    #server = lst[0]
    #filter_basis = lst[1]

    if request.method != "POST":
        raise Http404

    return render_to_response(template, {}, context_instance=RequestContext(request))


def server_stats(request, template):
    fill_servers_stats()