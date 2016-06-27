# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-06-27 01:00
from __future__ import unicode_literals

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('trials', '0002_auto_20160626_1747'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='trial',
            name='id',
        ),
        migrations.AddField(
            model_name='trial',
            name='uid',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True),
        ),
    ]
