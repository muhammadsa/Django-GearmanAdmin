from django.db import models
from django.contrib import admin

filter_basis_options = (
           ("R", "Recently"),
           ("H", "Hourly"),
           ("D", "Daily"),
           ("W", "Weekly"),
           ("M", "Monthly"),
           )


class Server(models.Model):
    server_name = models.CharField(max_length=100, verbose_name="Server Name")
    host = models.CharField(max_length=100, verbose_name="Host/IP")
    port_no = models.IntegerField(verbose_name='Port No.', default=4730)
    filter_basis = models.CharField(max_length=1, default='R', choices=filter_basis_options)
    
    def __unicode__(self):
        if self.server_name and self.server_name != '':
            return self.server_name
        else:
            return ':'.join(self.host,str(self.port_no))

        
class Setting(models.Model):
    name = models.CharField(max_length=100, verbose_name="Key", default='')
    value = models.CharField(max_length=250, verbose_name="Value")

    def __unicode__(self):
        return self.name

class RefreshRate(models.Model):
    name = models.CharField(max_length=120, verbose_name="rate name")
    rate_value = models.IntegerField(default=0, verbose_name="rate value")
    is_selected = models.BooleanField( verbose_name="Is Selected")

    def __unicode__(self):
        return self.name

class ServerHistory(models.Model):
    server=models.ForeignKey(Server, related_name= "server_history_server")
    healthy = models.BooleanField(default=True)
    version = models.CharField(max_length=100)
    response_time=models.DecimalField(max_digits=17,decimal_places=15)
    workers_count =models.IntegerField(default=-1)
    task_name = models.CharField(max_length=50,default='')
    running_count = models.IntegerField(default=-1)
    queued_count = models.IntegerField(default=-1)
    created = models.DateTimeField(auto_now_add=True)

admin.site.register(ServerHistory)
admin.site.register(RefreshRate)
admin.site.register(Setting)
admin.site.register(Server)


#import datetime

#class User(models.Model):
#    created     = models.DateTimeField(editable=False)
#    modified    = models.DateTimeField()

#    def save(self, *args, **kwargs):
#        ''' On save, update timestamps '''
#        if not self.id:
#            self.created = datetime.datetime.today()
#        self.modified = datetime.datetime.today()
#        return super(User, self).save(*args, **kwargs)