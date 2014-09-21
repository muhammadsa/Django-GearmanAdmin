# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Settings.auto_refresh'
        db.delete_column(u'GearmanMonitor_settings', 'auto_refresh')

        # Adding field 'Settings.name'
        db.add_column(u'GearmanMonitor_settings', 'name',
                      self.gf('django.db.models.fields.CharField')(default='', max_length=100),
                      keep_default=False)

        # Adding field 'Settings.value'
        db.add_column(u'GearmanMonitor_settings', 'value',
                      self.gf('django.db.models.fields.CharField')(default='aa', max_length=250),
                      keep_default=False)


    def backwards(self, orm):

        # User chose to not deal with backwards NULL issues for 'Settings.auto_refresh'
        raise RuntimeError("Cannot reverse this migration. 'Settings.auto_refresh' and its values cannot be restored.")
        
        # The following code is provided here to aid in writing a correct migration        # Adding field 'Settings.auto_refresh'
        db.add_column(u'GearmanMonitor_settings', 'auto_refresh',
                      self.gf('django.db.models.fields.BooleanField')(),
                      keep_default=False)

        # Deleting field 'Settings.name'
        db.delete_column(u'GearmanMonitor_settings', 'name')

        # Deleting field 'Settings.value'
        db.delete_column(u'GearmanMonitor_settings', 'value')


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
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '100'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        }
    }

    complete_apps = ['GearmanMonitor']