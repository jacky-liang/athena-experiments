from django.shortcuts import render, redirect
from django.http import Http404
from trials.models import Trial

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
    return redirect('trials/survey/?id={0}'.format(trial.id))
    
def survey(request):
    id = _get_id(request)
    trial = _get_trial(id)        
        
    if trial.survey_completed:
        return redirect('has_been_completed', portion='survey', id=id)
    if trial.survey_completed:
        return redirect('has_been_completed', portion='entirety', id=id)
        
    context = {
        'title': 'Experiments Home',
        'id': id
    }
    return render(request, 'trials/survey.html', context)