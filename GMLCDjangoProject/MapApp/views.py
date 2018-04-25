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

def visualization(request):
    template = loader.get_template('visualization.html')
    context = {"simulation_name": "viz"}
    return HttpResponse(template.render(context, request))

def transmission(request):
    template = loader.get_template('visualization_transmission.html')
    return HttpResponse(template.render({},request))

def distribution(request):
    template = loader.get_template('visualization.html')
    return HttpResponse(template.render({},request))

def comparison(request):
    template = loader.get_template('visualization_comparison.html')
    return HttpResponse(template.render({},request))

def about(request):
    template = loader.get_template('about.html')
    return HttpResponse(template.render({},request))
