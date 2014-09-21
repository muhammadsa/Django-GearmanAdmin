import json
from django.shortcuts import HttpResponse
from time import sleep

__author__ = 'Muhammads'

from django.shortcuts import render_to_response, RequestContext


def test(request, template):
    # for getting query string value in view
    s = request.GET.get('rurl', '')
    return render_to_response(template, locals(), context_instance=RequestContext(request))


class Simple:
    def __init__(self, val):
        self.d = val

    def get(self):
        return self.d

    def __repr__(self):
        return json.dumps(self.__dict__)


def delaytest(request, template):
    # for getting query string value in view

    s = Simple("this is a test")
    return HttpResponse(s, content_type="application/json")


def edit_favorites(request):
    if request.is_ajax():
        message = "Yes, AJAX!"
    else:
        message = "Not Ajax"
    return HttpResponse(message)


def test_ajax(request):
    sleep(3)
    if request.is_ajax():
        message = '{"d":"Yes, AJAX!"}'
    else:
        message = "{'d':'Not Ajax'}"
    return HttpResponse(message, content_type="application/json")
        # alternative test: return render_to_response('test_results.html')


def ajaxpost(request):
    return render_to_response("tests/ajaxpost.html", locals(), context_instance=RequestContext(request))
