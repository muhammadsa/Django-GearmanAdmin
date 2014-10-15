__author__ = 'Muhammads'
from django.shortcuts import Http404
import gearman
from gearman.errors import ConnectionError
from datetime import datetime, timedelta
from django.db.models import Min, Avg
from .models import Server, RefreshRate, ServerHistory
from . import DatabaseError
import socket


target_servers = {}


def get_auto_refresh():
    auto_refresh = RefreshRate.objects.filter(is_selected=True)
    if len(auto_refresh):
        return auto_refresh[0].rate_value
    else:
        return -1

filter_texts = {
    "H": "%s@%s",  # today@1 or yesterday@3
    "D": "%s/%s",  # Day/Month
    "W": "%s/%s",  # Week/Month
    "M": "%s/%s",  # Month/Year
}


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
        since = current - timedelta(hours=24)  # today(1) or yesterday(3)
        history_lst = ServerHistory.objects.extra({'target': "strftime('%H', \"created\")", 'target2': "strftime('%j',\"created\")", 'value_text': "case when strftime('%j',\"created\") = strftime('%j',\"now\") then 'today'   else 'yesterday'   end"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', "value_text").annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]
    elif filter_type == "D":
        since = current - timedelta(days=history_length)  # Day/Month
        history_lst = ServerHistory.objects.extra({'target': "strftime('%d', \"created\")", 'target2': "strftime('%m',\"created\")", 'value_text': "strftime('%m',\"created\")"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', 'value_text').annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]
    elif filter_type == "W":
        since = current - timedelta(weeks=history_length)  # Week/Month
        history_lst = ServerHistory.objects.extra({'target': "strftime('%W', \"created\")", 'target2': "strftime('%m',\"created\")", 'value_text': "strftime('%m',\"created\")"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', 'value_text').annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]
    elif filter_type == "M":
        since = current - timedelta(days=500)  # Month/Year
        history_lst = ServerHistory.objects.extra({'target': "strftime('%m', \"created\")", 'target2': "strftime('%Y',\"created\")", 'value_text': "strftime('%Y',\"created\")"}).filter(server__id=server_id).filter(created__range=[since, current]).values_list('target', 'target2', 'value_text').annotate(response_time=Avg('response_time')).order_by("-target2", "-target")[:history_length]

    return history_lst


def fill_servers_stats(length=50):
    fill_target_servers()
    for server_id in target_servers:
        fill_server_stats(server_id, length)


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
            fill_target_server(server_id)
            if not exists(server_id):
                raise Http404

    return target_servers[server_id]["conn"]


def get_server_obj(request, server_id=None):
    if server_id is None or server_id == 0 or server_id == '':
        server_id = get_valid_server_id(server_id)
    else:
        server_id = int(server_id)
        if not exists(server_id):
            fill_target_server(server_id)
            if not exists(server_id):
                raise Http404

    return target_servers[server_id]["server"]