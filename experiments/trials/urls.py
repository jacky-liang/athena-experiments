from django.conf.urls import url

from . import views

app_name = 'trials'
urlpatterns = [
    #/trials/
    url(r'^$', views.index, name='index'),
]