from django.shortcuts import render, redirect
from django.http import Http404, JsonResponse, HttpResponseForbidden
from trials.models import Trial
import json
import os

from datetime import datetime
from django.utils import timezone

_TRIAL_LENGTH = os.environ['TRIAL_LENGTH']
_SAMPLING_PERIOD = os.environ['SAMPLING_PERIOD']

#TODO: ONLY FOR DEBUG
from django.views.decorators.csrf import csrf_exempt

def _get_id(request):
    id = request.GET.get('id', '')
    print 'parsed id {0}'.format(id)
    return id

def _get_trial(id):
    try:
        trial = Trial.objects.get(pk=id)
    except Trial.DoesNotExist:
        raise Http404('Trial with id {0} does not exist'.format(id))
    return trial
    
def index(request):
    context = {
        'title': 'Experiments Home'
    }
    return render(request, 'trials/index.html', context)
    
def has_been_completed(request, portion='', id=''):
    context = {
        'portion': portion,
        'id': id
    }
    
    return render(request, 'trials/has_been_completed.html', context)
    
def start(request):
    trial = Trial.objects.create()
    return redirect('/trials/survey/?id={0}'.format(trial.id))
    
def survey(request):
    id = _get_id(request)
    trial = _get_trial(id)        
        
    if trial.survey_completed:
        return redirect('has_been_completed', portion='survey', id=id)
    if trial.trial_completed:
        return redirect('has_been_completed', portion='entirety', id=id)
        
    context = {
        'title': 'Experiments Survey',
        'id': id
    }
    return render(request, 'trials/survey.html', context)
    
def run(request):
    id = _get_id(request)
    trial = _get_trial(id)
    
    if trial.trial_completed:
        return redirect('has_been_completed', portion='entirety', id=id)
    
    context = {
        'title': 'Experiments Run',
        'id': id
    }
    
    return render(request, 'trials/run.html', context)
    
def token(request):
    id = _get_id(request)
    trial = _get_trial(id)
    
    if trial.trial_completed:
        return JsonResponse({'token':trial.token})
    else:
        return HttpResponseForbidden()
        
@csrf_exempt
def time_start(request):
    if request.method == 'POST':
        id = _get_id(request)
        trial = _get_trial(id)
        
        if trial.trial_completed:
            return redirect('has_been_completed', portion='entirety', id=id)
        
        trial.start_time = datetime.now()
        trial.save()
        
        return JsonResponse({'success':True})
    else:
        raise Http404('Page not found')
        
@csrf_exempt
def verify(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        token = data['token']
        
        try:
            trial = Trial.objects.get(token=token)
        except Trial.DoesNotExist:
            return JsonResponse({
                'valid': False
            })

        completed = trial.trial_completed
        has_been_verified = trial.has_been_verified
        
        if not has_been_verified:
            trial.has_been_verified = True
            trial.save()
            
        return JsonResponse({
            'valid': True,
            'completed': completed,
            'has_been_verified': has_been_verified
        })
    else:
        raise Http404('Page not found')
        
@csrf_exempt
def complete(request):
    if request.method == 'POST':
        id = _get_id(request)
        trial = _get_trial(id)
        
        cur_time = timezone.now()
        res_data = {'success':False}
        start_time = trial.start_time
        
        elapsed_seconds = (cur_time - start_time).seconds
        
        events = trial.events
        
        enough_time = elapsed_seconds >= _TRIAL_LENGTH
        enough_events = len(events) > _TRIAL_LENGTH / _SAMPLING_PERIOD
        
        if False in (enough_time, enough_events):
            res_data['msg'] = []
            if not enough_time:
                res_data['msg'].append('Not enough time has elapsed since start of trial!')
            if not enough_events:
                res_data['msg'].append('Not enough events have been submitted for this trial!')
            return JsonResponse(res_data)
        
        trial.trial_completed = True
        trial.save()
        res_data['success'] = True
            
        return JsonResponse(res_data)
            
    else:
        raise Http404('Page not found')
        
@csrf_exempt
def submit_survey(request):
    if request.method == 'POST':
        id = _get_id(request)
        trial = _get_trial(id)
        
        res_data = {'success':False}
        
        if not trial.survey_completed:
            data = json.loads(request.body)
            print data
            for key in ('age', 'wpm', 'video_game_player', 'experience', 'email'):
                if key in data:
                    setattr(trial, key, data[key])
            trial.survey_completed = True
            trial.save()
            res_data['success'] = True
            
        return JsonResponse(res_data)
            
    else:
        raise Http404('Page not found')
        
@csrf_exempt
def submit_events(request):
    if request.method == 'POST':
        id = _get_id(request)
        trial = _get_trial(id)
        
        res_data = {'success':False}
        
        if not trial.trial_completed:
            data = json.loads(request.body)
            if trial.events is None:
                trial.events = []
            trial.events.extend(data)
            trial.save()
            res_data['success'] = True
        
        return JsonResponse(res_data)
            
    else:
        raise Http404('Page not found')
    