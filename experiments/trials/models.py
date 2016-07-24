from __future__ import unicode_literals

from collections import namedtuple
import os
from django.db import models
from picklefield.fields import PickledObjectField
import uuid

class Trial(models.Model):
    #id
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    
    #verification token
    token = models.UUIDField(primary_key=False, default=uuid.uuid4, editable=False, unique=True)
    
    #flags:
    survey_completed = models.BooleanField(default=False)
    has_started = models.BooleanField(default=False)
    trial_completed = models.BooleanField(default=False)
    has_been_verified = models.BooleanField(default=False)
    
    #times:
    creation_time = models.DateTimeField(auto_now_add=True)
    start_time = models.DateTimeField(null=True)
    completion_time = models.DateTimeField(null=True)
    
    #survey:
    age = models.IntegerField(null=True)
    wpm = models.IntegerField(null=True)
    video_game_player = models.NullBooleanField(null=True)
    experience = models.IntegerField(null=True)
    email = models.EmailField(null=True)

    #data
    events = PickledObjectField(null=True)
    trial_type = PickledObjectField(null=True)
    '''
    #shared by both types
    secs
    is_tedious
    is_mistake
    
    #tedious data
    intended_key
    pressed_key
    is_backspace
    
    #relaxed data
    is_key_down
    '''  
       
class TrialsTypeBalancer(models.Model):

    _TRIAL_TYPES = (
        (-1, 1, True),
        (5, 0.8, True),
        (30, 0.8, True),
        (60, 0.8, True),
        (120, 0.8, True),
        (5, 0.5, True),
        (30, 0.5, True),
        (60, 0.5, True),
        (120, 0.5, True)
    )
    
    experiment_name = models.CharField(max_length=100, unique=True)
    creation_time = models.DateTimeField(auto_now_add=True)
    
    trials_type_record = PickledObjectField(null=False)
    trials_type_target = PickledObjectField(null=False)
    
    @staticmethod
    def trial_type_to_dict(trial_type):
        return {
            'period': trial_type[0],
            'ratio': trial_type[1],
            'tedious_first': trial_type[2]
        }