from django.urls import path

from . import views

urlpatterns = [
    path("", views.landing_page, name="Fabrikots"),
    path("join", views.join_game, name="Fabrikots"),
]