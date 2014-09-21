# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'ServerHistory.created'
        db.add_column(u'GearmanMonitor_serverhistory', 'created',
                      self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, default=datetime.datetime(2014, 7, 7, 0, 0), blank=True),
                      keep_default=False)


    def backwards(self, orm):
        # Deleting field 'ServerHistory.created'
        db.delete_column(u'GearmanMonitor_serverhistory', 'created')


    models = {
        u'GearmanMonitor.refreshrate': {
            'Meta': {'object_name': 'RefreshRate'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_selected': ('django.db.models.fields.BooleanField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '120'}),
            'rate_value': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'GearmanMonitor.server': {
            'Meta': {'object_name': 'Server'},
            'host': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'port_no': ('django.db.models.fields.IntegerField', [], {'default': '4730'}),
            'server_name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'GearmanMonitor.serverhistory': {
            'Meta': {'object_name': 'ServerHistory'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'healthy': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'queued_count': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'response_time': ('django.db.models.fields.DecimalField', [], {'max_digits': '17', 'decimal_places': '15'}),
            'running_count': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'server': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'server_history_server'", 'to': u"orm['GearmanMonitor.Server']"}),
            'task_name': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '50'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'workers_count': ('django.db.models.fields.IntegerField', [], {'default': '-1'})
        },
        u'GearmanMonitor.setting': {
            'Meta': {'object_name': 'Setting'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '100'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        }
    }

    complete_apps = ['GearmanMonitor']