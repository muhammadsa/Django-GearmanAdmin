__author__ = 'Muhammads'
from jsonresponse import to_json
from gearman.constants import *
import server as ss
from .server import *
import socket
from .util import *


@to_json("api")
def submit_job(request, server_id, task_name):
    try:
        pay_load = request.body if request.body is not None else ''
    except:
        pay_load = ''

    if request.method != 'POST':
        raise Exception('Not Allowed')

    bg = False
    wait = True
    maxr = 0
    timeout = None

    if request.GET:
        bg = to_bool(request.GET.get('bg'))
        wait = to_bool(request.GET.get('wait'))
        maxr = int('0' if request.GET.get('maxr') is None else request.GET.get('maxr'))

        if request.GET.get('timeout') is not None and request.GET.get('timeout') != r'':
            timeout = int(request.GET.get('timeout'))

    server_obj = get_server_obj(request, server_id)

    if server_obj is None:
        raise Exception("server is not found")

    conn_str = get_connection_str(server_obj)
    client = gearman.GearmanClient([conn_str])
    rq = client.submit_job(str(task_name), str(pay_load), priority=gearman.PRIORITY_HIGH, background=bg,
                           wait_until_complete=wait, max_retries=maxr, poll_timeout=timeout)
    result = check_request_status(rq, task_name)
    return dict(r=True, via='AJAX', result=result)


def check_request_status(job_request, task_name):
    if job_request.complete:
        return "Task name %s : Job %s finished!  Result: %s - %s" % (task_name, job_request.job.unique, job_request.state, job_request.result)
    elif job_request.timed_out:
        return "Task name %s : Job %s timed out!" % (task_name, job_request.unique)
    elif job_request.state == JOB_COMPLETE:
        return "Task name %s : Job %s finished!  Result: %s - %s" % (task_name, job_request.job.unique, job_request.state, job_request.result)
    elif job_request.state == JOB_CREATED:
        return "Task name %s : Job %s has been accepted and created!" % (task_name, '' if job_request.job.unique is None else job_request.job.unique)
    elif job_request.state == JOB_UNKNOWN:
        return "Task name %s : Job %s connection failed!" % (task_name, job_request.unique)
    elif job_request.state == JOB_PENDING:
        return "Task name %s : Job %s has been submitted, pending handle" % (task_name, job_request.unique)
    elif job_request.state == JOB_FAILED:
        return "Task name %s : Job %s received an explicit fail" % (task_name, job_request.unique)
    else:
        return "Job status sent to task named %s is currently unknown, either unsubmitted or connection failed" % (task_name)


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


@to_json('schart')
def schart(request, template="chart_data.html", callback="", server_id=0, data_length=50, filter_type='R'):

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
    return dict(history=ss.target_servers[server_id]["history"], down_times=ss.target_servers[server_id]["down_times"])
    # return render_to_response(template, {"target_server": target_servers[server_id], 'cb': callback},
    # context_instance=RequestContext(request))
