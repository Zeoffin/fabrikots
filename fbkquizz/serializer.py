from rest_framework import serializers
from .models import Question, UserSettings


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('text', 'type')


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ('user', 'active', 'points')
