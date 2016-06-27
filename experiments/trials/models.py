from __future__ import unicode_literals

from django.db import models
from picklefield.fields import PickledObjectField
import uuid

class Trial(models.Model):
    #id
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    
    #verification token
    token = models.UUIDField(primary_key=False, default=uuid.uuid4, editable=False, unique=True)
    
    #flags:
    trial_completed = models.BooleanField(default=False)
    survey_completed = models.BooleanField(default=False)
    has_been_verified = models.BooleanField(default=False)
    
    #times:
    creation_time = models.DateTimeField(auto_now_add=True)
    completion_time = models.DateTimeField(blank=True)
    
    #survey:
    age = models.IntegerField(blank=True)
    wpm = models.IntegerField(blank=True)
    video_game_player = models.BooleanField(default=False)
    experience = models.IntegerField(default=0)
    email = models.EmailField()

    #data
    events = PickledObjectField()
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