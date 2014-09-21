# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Server'
        db.create_table(u'GearmanMonitor_server', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('server_name', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('host', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('port_no', self.gf('django.db.models.fields.IntegerField')(default=4730)),
        ))
        db.send_create_signal(u'GearmanMonitor', ['Server'])


    def backwards(self, orm):
        # Deleting model 'Server'
        db.delete_table(u'GearmanMonitor_server')


    models = {
        u'GearmanMonitor.server': {
            'Meta': {'object_name': 'Server'},
            'host': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'port_no': ('django.db.models.fields.IntegerField', [], {'default': '4730'}),
            'server_name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['GearmanMonitor']