from django.http import HttpResponse
from django.shortcuts import render


def landing_page(request):
    return render(request, "fabrikots/index.html")


def join_game(request):
    return render(request, "fabrikots/join.html")
