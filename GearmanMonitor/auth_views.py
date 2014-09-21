__author__ = 'Muhammads'
from django.shortcuts import render_to_response, RequestContext


def google_login(request, template):
    return render_to_response(template, {}, context_instance=RequestContext(request))


def index(request):
    return None


def auth_return(request):
    return None
