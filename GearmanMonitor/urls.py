from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('GearmanMonitor.views',
                       url(r'^$', 'servers', {'template': 'servers.html'}, name='servers'),
                       url(r'^all$', 'servers', {"template": "servers.html"}, name='servers'),
                       url(r"^s/(?P<server_id>.*)$", 'server', {'template': 'server.html'}, name='server'),
                       url(r'^schart/(?P<server_id>.*)$', 'schart', {'template': 'chart_data.html', 'callback': 't'},
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

urlpatterns += patterns('GearmanMonitor.auth_views',
                        (r'^auth$', 'index'),
                        (r'^oauth2callback', 'auth_return'),
                        url(r'^auth/google$', 'google_login', name='google_login'),
                        url(r'^google/login$', 'google_login', {'template': 'tests/google_login.html'},
                            name='google_login'),
                        #url(r'^auth/login/$', 'django.contrib.auth.views.login', {'template_name':
                        )

urlpatterns += patterns('',
                        url(r'^auth/login/$', 'django.contrib.auth.views.login', {'template_name': 'tests/login.html'},
                            name='login'),
                        )


urlpatterns += patterns('GearmanMonitor.testviews',
                        url(r'^login_test/$', 'test', {'template': 'tests/login.html'}, name='login'),
                        url(r'^test/input/$', 'test', {'template': 'tests/input.html'}, name='input'),
                        url(r'^test/$', 'test', {'template': 'tests/test.html'}, name='test'),
                        url(r'^test1/$', 'delaytest', {'template': 'tests/test1.html'}, name='test1'),
                        url(r'^test_results/$', 'test_ajax'),
                        url(r'^ajaxpost/$', 'ajaxpost'),


                        )
