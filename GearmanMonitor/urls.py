from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('GearmanMonitor.views',
                       url(r'^$', 'servers', {'template': 'servers.html'}, name='servers'),
                       url(r'^all$', 'servers', {"template": "servers.html"}, name='servers'),
                       url(r"^s/(?P<server_id>.*)$", 'server', {'template': 'server.html'}, name='server'),
                       url(r'^schart/?(?P<filter_type>[a-zA-Z]*)/?(?P<server_id>\d*)/?(?P<data_length>\d*)$', 'schart', {'template': 'chart_data.html', 'callback': 't'},
                           name='schart'),
                       url(r'^status/(?P<server_id>.*?)$', 'get_status', {'template': 'status.html'}, name='status'),
                       url(r'^add$', 'add_server', {'template': 'add_server.html'}, name='add_server'),
                       url(r"^del/(?P<server_id>\d+)$", 'del_server', {}, name='del_server'),
                       url(r'^sdown/(?P<grace>.*/)?(?P<server_id>\d+)$', 'shutdown', {}, name='sdown'),
                       url(r"workers/(?P<server_id>.*?)$", 'get_workers', {'template': 'workers.html'}, name='workers'),
                       url(r'refresh/(?P<rate>.*?)$', 'refresh', {}, name='refresh'),
                       url(r'refresh_script/(?P<rate>.*?)$', 'refresh_script', {}, name='refresh_script'),
                       url(r'^summary/$', 'summary', {'template': 'summary.html'}, name='summary'),
                       url(r'^sfilter/(?P<filter_info>.*)$', 'sfilter', {'template': 'sfilter.html'}, name='sfilter'),
                       url(r'^about$', 'aboutme', {'template': 'about.html'}, name='aboutme'),

                       # Uncomment the next line to enable the admin:
                       url(r'^admin/', include(admin.site.urls)),
                       )
