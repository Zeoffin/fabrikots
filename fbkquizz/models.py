from django.db import models
from django.contrib.auth.models import User


class Question(models.Model):
    """
    Current type ideas:
        - text (Just a text box, spelling needs to be correct !)
        - multiple choice
        - None (no user input required !)
    """

    title = models.CharField(max_length=60)
    text = models.CharField(max_length=200)
    type = models.CharField(max_length=20, default=None, blank=True)
    notes = models.CharField(max_length=400, blank=True)

    def __str__(self):
        return f"{self.id} | {self.title}"


class GlobalSettings(models.Model):
    # Model that stores current question / trivia (order, id? )
    pass


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    active = models.BooleanField()
    points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}"
