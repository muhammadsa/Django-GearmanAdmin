from django.shortcuts import render_to_response, redirect, HttpResponseRedirect
from django.template.context import RequestContext
# from django.conf import settings
from .forms import ServerForm
from GearmanMonitor.models import filter_basis_options
from django.shortcuts import HttpResponse
import string
from .apis import *
import server as ss


def summary(request, template):
    data_length = 10
    fill_servers_stats(data_length)

    return render_to_response(template, {"target_servers": ss.target_servers,
                                         "auto_refresh": get_auto_refresh(),
                                         'length': data_length * 1024 / 50,
                                         'data_length': data_length,
                                         "filter": filter_basis_options},
                              context_instance=RequestContext(request))


def servers(request, template="servers.html"):

    data_length = 50
    fill_servers_stats()
    auto_ref = get_auto_refresh()
    if auto_ref and auto_ref != -1:
        return render_to_response(template,
                                  {"target_servers": ss.target_servers, "auto_refresh": auto_ref,
                                   'length': data_length * 1024 / 50, "data_length": data_length,
                                   "filter": filter_basis_options},
                                  context_instance=RequestContext(request))
    else:
        # (params/local vars) are going to all templates and also its included ones too
        return render_to_response(template, {"target_servers": ss.target_servers, 'length': data_length * 1024 / 50,
                                             "data_length": data_length,
                                             "filter": filter_basis_options},
                                  context_instance=RequestContext(request))


def server(request, template, server_id=0):
    server_id = get_valid_server_id(int(server_id))
    fill_server_stats(server_id, history_length=50)  # , force_fill=True)

    return render_to_response(template, {"target_server": ss.target_servers[server_id]},
                              context_instance=RequestContext(request))


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
    ss.target_servers[server_id]["status_response"] = status_response

    return render_to_response(template,
                              {"target_server": ss.target_servers[server_id], "auto_refresh": get_auto_refresh(),
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


def job(request, template, server_id, task_name):
    return render_to_response(template,{'server_id': server_id, 'task_name': task_name},
                              context_instance=RequestContext(request))