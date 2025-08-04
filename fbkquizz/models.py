from django.db import models
from django.contrib.auth.models import User


class Question(models.Model):
    """
    Current type ideas:
        - text (Just a text box, spelling needs to be correct !)
        - multiple choice
        - None (no user input required !)
    """

    TYPES = (
        ("info", "info"),
        ("multipleChoice", "multipleChoice"),
        ("freeText", "freeText"),
        ("userChoice", "userChoice")
    )

    title = models.CharField(max_length=60, blank=True)
    text = models.CharField(max_length=400, blank=True)
    # active = models.BooleanField(default=False)
    type = models.CharField(max_length=256, choices=TYPES)
    answers = models.JSONField(default=dict, blank=True)
    points = models.IntegerField(default=1, blank=True)
    time = models.IntegerField(default=0)
    notes = models.CharField(max_length=400, blank=True)
    finished = models.BooleanField(default=False)
    image = models.ImageField(upload_to='question_images/', blank=True, null=True)

    def __str__(self):
        return f"{self.id} | {self.title}"


class GlobalSettings(models.Model):
    # Model that stores current question / trivia (order, id? )
    currentQuestion = models.ForeignKey(Question, default=None, on_delete=models.CASCADE)
    timer = models.IntegerField(default=30)
    current_round = models.IntegerField(default=1)  # Track current quiz round for muting functionality

    def __str__(self):
        return f"{self.id}"


class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    active = models.BooleanField()
    points = models.IntegerField(default=0)
    answers = models.JSONField(default=dict, blank=True)
    accepted_answers = models.JSONField(default=dict, blank=True)  # Track admin-accepted answers
    muted_until_round = models.IntegerField(default=0)  # 0 means not muted, positive number means muted until that round count

    def __str__(self):
        return f"{self.user.username}"
