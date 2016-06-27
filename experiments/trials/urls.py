from django.conf.urls import url

from . import views

app_name = 'trials'
urlpatterns = [
    #/trials/
    url(r'^$', views.index, name='index'),
    url(r'^start/$', views.start, name='start'),
    url(r'^survey/$', views.survey, name='survey'),
    url(r'^run/$', views.run, name='run'),
    url(r'^verify/$', views.verify, name='verify'),
    url(r'^token/$', views.token, name='token'),
    url('r^has_been_completed/$', views.has_been_completed, name='has_been_completed')
]