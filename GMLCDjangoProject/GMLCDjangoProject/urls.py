"""Map URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""

from django.conf.urls import *

import MapApp.views as views

urlpatterns = [
    ## Landing Page
    #url(r'^$', views.map, name='map'),

    ## Core Visualizations
    url(r'^map/(?P<simulation_name>[a-zA-Z0-9_]+)/$', views.map, name='map'),
    url(r'^visualization/(?P<scenario_name>[a-zA-Z0-9_]+)/$', views.scenario, name='scenario'),
    url(r'^transmission/$', views.transmission),
    url(r'^comparison/$', views.comparison),
    #url(r'^visualization/$', views.visualization, name='visualization'),
    url(r'^about/$', views.about, name='about'),


]
