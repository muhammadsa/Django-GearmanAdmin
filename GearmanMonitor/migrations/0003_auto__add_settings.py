# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Settings'
        db.create_table(u'GearmanMonitor_settings', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('auto_refresh', self.gf('django.db.models.fields.BooleanField')()),
        ))
        db.send_create_signal(u'GearmanMonitor', ['Settings'])


    def backwards(self, orm):
        # Deleting model 'Settings'
        db.delete_table(u'GearmanMonitor_settings')


    models = {
        u'GearmanMonitor.server': {
            'Meta': {'object_name': 'Server'},
            'host': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'port_no': ('django.db.models.fields.IntegerField', [], {'default': '4730'}),
            'server_name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        u'GearmanMonitor.settings': {
            'Meta': {'object_name': 'Settings'},
            'auto_refresh': ('django.db.models.fields.BooleanField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['GearmanMonitor']