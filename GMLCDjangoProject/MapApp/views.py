from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
from django.template import loader
from django.conf import settings
import untangle, requests, json
import json
from django.shortcuts import HttpResponseRedirect
from django.core.urlresolvers import reverse
from .aws.utils import AWSDownload

def map(request, simulation_name):
    if simulation_name is "":
        simulation_name = "ieee123"
    context = {"simulation_name": simulation_name}
    template = loader.get_template('map.html')
    return HttpResponse(template.render(context, request))

def visualization(request):
    template = loader.get_template('visualization.html')
    context = {"simulation_name": "viz"}
    return HttpResponse(template.render(context, request))

def scenario(request,scenario_name):
    if scenario_name not in ["scenario0","scenario1","scenario2","scenario3"]:
        scenario_name="scenario0"
    template = loader.get_template('visualization.html')
    context = {"scenario_name": scenario_name}
    return HttpResponse(template.render(context, request))

def transmission(request):
    template = loader.get_template('visualization_transmission.html')
    return HttpResponse(template.render(request))

def comparison(request):
    template = loader.get_template('visualization_comparison.html')
    return HttpResponse(template.render(request))

def about(request):
    template = loader.get_template('about.html')
    return HttpResponse(template.render( request))
