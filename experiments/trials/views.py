from operator import itemgetter

from django.shortcuts import render, redirect
from django.http import Http404, JsonResponse, HttpResponseForbidden
from trials.models import Trial, TrialsTypeBalancer
import json
import os

from datetime import datetime
from django.utils import timezone

try:
    _TRIAL_LENGTH = int(os.environ['TRIAL_LENGTH'])
    _EXPR_NAME = os.environ['EXPR_NAME']
    _SAMPLE_SIZE = int(os.environ['SAMPLE_SIZE'])
except:
    print 'Environment Variables not imported correctly. Heroku is not running!'
    
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
    
def _get_trials_type_balancer():
    try:
        trials_type_balancer = TrialsTypeBalancer.objects.get(experiment_name = _EXPR_NAME)
    except TrialsTypeBalancer.DoesNotExist:
        trials_type_balancer = TrialsTypeBalancer.objects.create(
                                            experiment_name = _EXPR_NAME,
                                            trials_type_record = {key:0 for key in TrialsTypeBalancer._TRIAL_TYPES},
                                            trials_type_target = {key:_SAMPLE_SIZE for key in TrialsTypeBalancer._TRIAL_TYPES})
        trials_type_balancer.save()
    return trials_type_balancer
    
def _get_trial_type():
    trials_type_balancer = _get_trials_type_balancer()
    
    def argmax(lst):
        max_val = float('-inf')
        max_i = 0
        for i, val in enumerate(lst):
            if val > max_val:
                max_val = val
                max_i = i
        return max_i
    
    remaining_dict = {key:trials_type_balancer.trials_type_target[key] - val 
                                for key, val in trials_type_balancer.trials_type_record.items()}
    
    max_index = argmax(remaining_dict.values())

    return remaining_dict.keys()[max_index]
    
def index(request):
    context = {
        'title': 'Experiments Home'
    }
    return render(request, 'trials/index.html', context)
    
def has_been_completed(request):
    context = {
        'portion': request.GET.get('portion', ''),
        'id': request.GET.get('id','')
    }
    
    return render(request, 'trials/has_been_completed.html', context)
    
def start(request):
    trial = Trial.objects.create()
    trial.trial_type = _get_trial_type()
    trial.save()
    return redirect('/trials/survey/?id={0}'.format(trial.id))
    
def survey(request):
    id = _get_id(request)
    trial = _get_trial(id)        
        
    if trial.survey_completed:
        return redirect('/trials/has_been_completed?portion=survey&id={0}'.format(id))
    if trial.trial_completed:
        return redirect('/trials/has_been_completed?portion=entirety&id={0}'.format(id))
        
    context = {
        'title': 'Experiments Survey',
        'id': id
    }
    return render(request, 'trials/survey.html', context)
    
def run(request):
    id = _get_id(request)
    trial = _get_trial(id)
    
    if not trial.survey_completed:
        return redirect('/trials/survey/?id={0}'.format(id))
    
    if trial.trial_completed:
        return redirect('/trials/has_been_completed?portion=entirety&id={0}'.format(id))
    
    context = {
        'title': 'Experiments Run',
        'id': id,
        'trial_length': _TRIAL_LENGTH,
        'trial_type': json.JSONEncoder().encode(TrialsTypeBalancer.trial_type_to_dict(trial.trial_type))
    }
    
    return render(request, 'trials/experiment.html', context)
    
def token(request):
    id = _get_id(request)
    trial = _get_trial(id)
    
    if trial.trial_completed:
        return JsonResponse({'token':trial.token})
    else:
        return HttpResponseForbidden()
        
# TODO: Experiments page needs to call this 
def time_start(request):
    if request.method == 'POST':
        id = _get_id(request)
        trial = _get_trial(id)
        
        if trial.trial_completed:
            return redirect('has_been_completed', portion='entirety', id=id)
        
        if trial.has_started:
            return JsonResponse({'success':False, 'msg':'Trial has already started!'})
        
        trial.start_time = timezone.now()
        trial.has_started = True
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
        
def complete(request):
    id = _get_id(request)
    trial = _get_trial(id)
    
    cur_time = timezone.now()
    start_time = trial.start_time
    
    elapsed_seconds = (cur_time - start_time).seconds
    
    events = trial.events
    
    enough_time = elapsed_seconds >= _TRIAL_LENGTH
    
    context = {}
    
    if False and not enough_time:
        context['msg'] = 'An error has occured to complete the trial for {0}. Trial is unable to be marked complete!'.format(id)
    elif False and trial.events == None:
        context['msg'] = 'Data for this trial with id {0} has not been properly submitted! Unable to mark complete!'.format(id)
    else:    
        context['msg'] = "Thanks for completing the experiment! Here's the token for the trial: {0}".format(trial.token)
        
        if not trial.trial_completed:
            trial.trial_completed = True
            trial.save()
            
            trials_type_balancer = _get_trials_type_balancer()
            trials_type_balancer.trials_type_record[trial.trial_type] += 1
            trials_type_balancer.save()
        
        
    return render(request, 'trials/complete.html', context)   
        
        
def submit_survey(request):
    if request.method == 'POST':
        id = _get_id(request)
        trial = _get_trial(id)
        
        res_data = {'success':False};
        
        if not trial.survey_completed:
            data = json.loads(request.body)
            for key in ('age', 'wpm', 'video_game_player', 'experience', 'email'):
                if key in data:
                    setattr(trial, key, data[key])
            trial.survey_completed = True
            trial.save()
            res_data['success'] = True
            
        return JsonResponse(res_data)
            
    else:
        raise Http404('Page not found')
        
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
    