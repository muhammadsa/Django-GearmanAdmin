from django.shortcuts import render_to_response, redirect, Http404, HttpResponseRedirect
from jsonresponse import to_json
from django.template.context import RequestContext
import gearman
# from django.conf import settings
# from connection import GearmanConnection
from . import DatabaseError
from gearman.errors import ConnectionError
from .models import Server, RefreshRate, ServerHistory
from django.db.models import Min, Avg
from .forms import ServerForm
from GearmanMonitor.models import filter_basis_options
from django.shortcuts import HttpResponse
import string
import socket
from datetime import datetime, timedelta

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

    if target_servers is not None and server_id in target_servers:
        return

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
    data_length = 50
    fill_servers_stats()
    auto_ref = get_auto_refresh()
    if auto_ref and auto_ref != -1:
        return render_to_response(template,
                                  {"target_servers": target_servers, "auto_refresh": auto_ref,
                                   'length': data_length * 1024 / 50, "data_length": data_length,
                                   "filter": filter_basis_options},
                                  context_instance=RequestContext(request))
    else:
        # (params/local vars) are going to all templates and also its included ones too
        return render_to_response(template, {"target_servers": target_servers, 'length': data_length * 1024 / 50,
                                             "data_length": data_length,
                                             "filter": filter_basis_options},
                                  context_instance=RequestContext(request))


def server(request, template, server_id=0):
    server_id = get_valid_server_id(int(server_id))
    fill_server_stats(server_id, history_length=50)  # , force_fill=True)

    return render_to_response(template, {"target_server": target_servers[server_id]},
                              context_instance=RequestContext(request))


def get_auto_refresh():
    auto_refresh = RefreshRate.objects.filter(is_selected=True)
    if len(auto_refresh):
        return auto_refresh[0].rate_value
    else:
        return -1

filter_texts = {
    "H": "%s@%s",#today@1 or yesterday@3
    "D": "%s/%s",#Day/Month
    "W": "%s/%s",#Week/Month
    "M": "%s/%s",#Month/Year
}


def get_history_stats(history_lst, filter_text):
    lst = ()
    # if len(history_lst) == 0:
    # return lst
    #this_obj = today.timetuple().tm_yday
    template = filter_texts[filter_text]

    if len(history_lst) == 1:
        history = history_lst[0]
        value_text = str(template % (history[2], history[0]))
        return str(([value_text, float(history[3])],
                    [value_text, float(history[3])])).strip('()').strip(',')
    else:
        for history in history_lst:
            value_text = str(template % (history[2], history[0]))
            lst1 = ([value_text,
                     float(history[3])],)
            lst = lst1 + lst
        return str(lst).strip('()').strip(',')


def get_history(history_lst):
    lst = ()
    # if len(history_lst) == 0:
    # return lst
    if len(history_lst) == 1:
        history = history_lst[0]
        return str(([str(history.created.hour) + ':' + str(history.created.minute) + ':' + str(history.created.second),
                     float(history.response_time)],
                    [str(history.created.hour) + ':' + str(history.created.minute) + ':' + str(history.created.second),
                     float(history.response_time)])).strip('()').strip(',')
    else:
        for history in history_lst:
            lst1 = ([str(history.created.hour) + ':' + str(history.created.minute) + ':' + str(history.created.second),
                     float(history.response_time)],)
            lst = lst1 + lst
        return str(lst).strip('()').strip(',')


def get_down_times(history_lst):
    lstd = ()
    for dhistory in history_lst:
        if dhistory.healthy is False or dhistory.healthy == 0:
            lstd1 = (
                [str(dhistory.created.hour) + ':' + str(dhistory.created.minute) + ':' + str(dhistory.created.second),
                 'gearman was not responding at ' +
                 str(dhistory.created.hour) + ':' + str(dhistory.created.minute) + ':' + str(dhistory.created.second)],)
            lstd = lstd + lstd1

    return str(lstd).strip('()').strip(',')


def fill_server_stats(server_id, history_length, filter_type='R'):
    version = ""
    response_time = ""
    server_obj = Server(id=server_id)
    health = True

    try:
        socket.setdefaulttimeout(0.5)
        # Retrieves the version number of the Gearman server
        version = target_servers[server_id]["conn"].get_version()
        # Sends off a debugging string to execute an application ping on the Gearman server
        response_time = target_servers[server_id]["conn"].ping_server()
        #target_servers[server_id]["conn"].ping_server()
    except ConnectionError:
        health = False
        pass
    except:
        health = False
        pass

    try:
        # saving in history
        history = ServerHistory(server=server_obj, healthy=health,
                                response_time=0.0 if response_time is None or response_time == ''
                                else response_time,
                                version=version, created=datetime.now())
        history.save()
    except DatabaseError:
        pass

    target_servers[server_id]["version"] = version
    target_servers[server_id]["response_time"] = response_time
    # ("R", "Recently"),
    # ("H", "Hourly"),
    # ("D", "Daily"),
    # ("W", "Weekly"),
    # ("M", "Monthly"),
    if filter_type == "R":
        history_lst = ServerHistory.objects.filter(server__id=server_id).order_by("-created")[:history_length]
        target_servers[server_id]["history"] = get_history(history_lst)
        target_servers[server_id]["down_times"] = get_down_times(history_lst)
    else:
        #get the last 24 hours and take average of each hour
        current = datetime.now()
        history_lst = prepare_history_query(server_id, current, filter_type, history_length)
        target_servers[server_id]["history"] = get_history_stats(history_lst, filter_type)
        target_servers[server_id]["down_times"] = ""


def prepare_history_query(server_id, current, filter_type, history_length):
    if filter_type == "H":
        since = current - timedelta(hours=24)#today(1) or yesterday(3)
        history_lst = ServerHistory.objects.extra({'target': "strftime('%H', \"created\")", 'target2': "strftime('%j',\"created\")", 'value_text': "case when strftime('%j',\"created\") = strftime('%j',\"now\") then 'today'   else 'yesterday'   end"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', "value_text").annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]
    elif filter_type == "D":
        since = current - timedelta(days=history_length)#Day/Month
        history_lst = ServerHistory.objects.extra({'target': "strftime('%d', \"created\")", 'target2': "strftime('%m',\"created\")", 'value_text': "strftime('%m',\"created\")"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', 'value_text').annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]
    elif filter_type == "W":
        since = current - timedelta(weeks=history_length)#Week/Month
        history_lst = ServerHistory.objects.extra({'target': "strftime('%W', \"created\")", 'target2': "strftime('%m',\"created\")", 'value_text': "strftime('%m',\"created\")"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', 'value_text').annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]
    elif filter_type == "M":
        since = current - timedelta(days=500)#Month/Year
        history_lst = ServerHistory.objects.extra({'target': "strftime('%m', \"created\")", 'target2': "strftime('%Y',\"created\")", 'value_text': "strftime('%Y',\"created\")"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', 'value_text').annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]

    return history_lst



def fill_servers_stats(length=50):
    fill_target_servers()
    global target_servers
    for server_id in target_servers:
        fill_server_stats(server_id, length)


@to_json('schart')
def schart(request, template="chart_data.html", callback="", server_id=0, data_length=50, filter_type='R'):
    global target_servers

    # "R"
    # "H"
    # "D"
    # "W"
    # "M"
    if filter_type is None or filter_type == u'':
        filter_type = 'R'

    try:
        if server_id is None or server_id == u'':
            server_id = get_valid_server_id()
        else:
            server_id = int(server_id)
    except TypeError:
        raise Http404

    try:
        if data_length is None or data_length == u'':
            data_length = 10
        else:
            data_length = int(data_length)
    except TypeError:
        data_length = 10
        pass

    fill_target_server(server_id)
    fill_server_stats(server_id, data_length, filter_type)
    return dict(history=target_servers[server_id]["history"], down_times=target_servers[server_id]["down_times"])
    # return render_to_response(template, {"target_server": target_servers[server_id], 'cb': callback},
    # context_instance=RequestContext(request))


def get_status(request, template, server_id=0):
    fill_target_servers()
    conn = get_server_conn(request, server_id)
    status_response = ""
    err = None
    try:
        socket.setdefaulttimeout(2)
        # Retrieves a list of all registered tasks and reports how many items/workers are in the queue
        status_response = conn.get_status()
    except ConnectionError:
        err = "connection error or timeout, we could not get any info from this server," \
              " either to check this server or try again later"
        pass
    except:
        err = "something went wrong while getting workers, please make sure there is no connection" \
              " issue with your server (ping server) or try again later"
        pass

    server_id = int(server_id)
    target_servers[server_id]["status_response"] = status_response

    return render_to_response(template,
                              {"target_server": target_servers[server_id], "auto_refresh": get_auto_refresh(),
                               "err": err},
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
    if request.method == "POST":
        server_obj = Server.objects.get(pk=server_id)
        if not server_obj or server_obj is None:
            message = '{"r":"false", "error": "NOT FOUND"}'
            return HttpResponse(message, content_type="application/json")
        else:
            server_obj.delete()

        if request.is_ajax():
            message = '{"r":"true", "via":"AJAX"}'
        else:
            message = '{"r":"true", "via": request["HTTP_USER_AGENT"]}'
    else:
        message = '{"r":"false", "error": "NOT ALLOWED"}'

    return HttpResponse(message, content_type="application/json")


def get_valid_server_id(server_id=None):
    global target_servers
    if server_id is None or server_id == 0 or server_id == '':
        least_server = Server.objects.all().aggregate(Min("id"))
        server_id = least_server["id__min"]

    server_id = int(server_id)

    if not exists(server_id):
        fill_target_server(server_id)
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


@to_json('api')
def shutdown(request, server_id, grace=None):
    if request.method != 'POST':
        raise Exception("Not Allowed")

    fill_target_servers()
    conn = get_server_conn(request, server_id)

    if not conn:
        raise Exception("connection is not established with gearmand server")

    if grace is not None and (grace == 'grace' or grace == 'grace/'):
        grace = True
    else:
        grace = False

    try:
        socket.setdefaulttimeout(2)
        conn.send_shutdown(graceful=grace)
    except:
        raise Exception("can not execute command on gearmand server")

    if request.is_ajax():
        return dict(r=True, via='AJAX')
    else:
        return dict(r=True, via='HTTP')


def get_workers(request, template, server_id):
    fill_target_servers()
    conn = get_server_conn(request, server_id)
    workers = None
    err = None
    try:
        socket.setdefaulttimeout(2)
        workers = conn.get_workers()
    except ConnectionError:
        err = "connection error or timeout, we could not get any info from this server, " \
              "either to check this server or try again later"
        pass
    except:
        err = "something went wrong while getting workers, please make sure there " \
              "is no connection issue with your server (ping server) or try again later"
        pass

    return render_to_response(template, {"workers": workers, "error": err},
                              context_instance=RequestContext(request))


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
    # redirect to previous visited page
    # return HttpResponseRedirect(request.META.get('HTTP_REFERER'))

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


@to_json('api')
def refresh_script(request, rate=-1):
    if request.method != 'POST':
        raise Exception("Not Allowed")

    old_selected = None

    try:
        old_selected = RefreshRate.objects.get(is_selected=True)
    except Exception as e:
        # to bypass empty results
        pass

    if rate == '-1' or rate == '':
        if old_selected:
            try:
                old_selected.is_selected = False
                old_selected.save()
            except DatabaseError:
                raise Exception("Database error while disabling .. set old_selected = 0")

        return dict(r=True, via='AJAX')

    if old_selected and old_selected.rate_value == rate:
        return dict(r=True, via='AJAX', affected=0)

    if old_selected:
        old_selected.is_selected = False
        old_selected.save()

    try:
        target_rate = RefreshRate.objects.get(rate_value=rate)
        target_rate.is_selected = True
        target_rate.save()
    except DatabaseError:
        raise Exception("Database error while updating record")

    # return HttpResponseRedirect(request.META.get('HTTP_REFERER'))
    return dict(r=True, via='AJAX')


def summary(request, template):
    data_length = 10
    fill_servers_stats(data_length)
    global target_servers

    return render_to_response(template, {"target_servers": target_servers,
                                         "auto_refresh": get_auto_refresh(),
                                         'length': data_length * 1024 / 50,
                                         'data_length': data_length,
                                         "filter": filter_basis_options},
                              context_instance=RequestContext(request))


def sfilter(request, filter_info, template):
    lst = string.split(filter_info, '_', 2)
    # server = lst[0]
    # filter_basis = lst[1]

    if request.method != "POST":
        raise Http404

    return render_to_response(template, {}, context_instance=RequestContext(request))


def server_stats(request, template):
    fill_servers_stats()


def aboutme(request, template):
    return render_to_response(template, context_instance=RequestContext(request))