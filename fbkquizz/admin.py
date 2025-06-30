from django.contrib import admin
from .models import UserSettings, Question, GlobalSettings

# Register your models here.
admin.site.register(UserSettings)
admin.site.register(Question)
admin.site.register(GlobalSettings)
