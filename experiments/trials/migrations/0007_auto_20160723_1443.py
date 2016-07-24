# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-07-23 21:43
from __future__ import unicode_literals

from django.db import migrations, models
import picklefield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('trials', '0006_trial_start_time'),
    ]

    operations = [
        migrations.CreateModel(
            name='TrialsTypeBalancer',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('experiment_name', models.CharField(max_length=100, unique=True)),
                ('creation_time', models.DateTimeField(auto_now_add=True)),
                ('trials_type_record', picklefield.fields.PickledObjectField(editable=False)),
                ('trials_type_target', picklefield.fields.PickledObjectField(editable=False)),
            ],
        ),
        migrations.AddField(
            model_name='trial',
            name='trial_type',
            field=picklefield.fields.PickledObjectField(editable=False, null=True),
        ),
    ]