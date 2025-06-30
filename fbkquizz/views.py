from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth import get_user_model
from user_api.serializers import UserSerializer
from .models import UserSettings, GlobalSettings, Question
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

UserModel = get_user_model()


class GameUsersInfo(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (SessionAuthentication,)

    def get(self, request):

        response = {}
        user_points = {}

        users = UserModel.objects.all()
        for user in users:
            try:
                user_setting = UserSettings.objects.get(user=user)
                user_points[user.username] = {
                    "active": user_setting.active,
                    "points": user_setting.points
                }
                response = {k: v for k, v in sorted(user_points.items(), key=lambda item: item[1]['points'], reverse=True)}
            except UserSettings.DoesNotExist:
                continue

        return Response({"response": response}, status=status.HTTP_200_OK)


class UpdateGameUser(APIView):
    permission_classes = (permissions.IsAdminUser,)
    authentication_classes = (SessionAuthentication,)

    # @method_decorator(login_required)
    def post(self, request):
        response = {}

        print(request.data)

        return Response({"response": "wow"}, status=status.HTTP_200_OK)


class Questions(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = (SessionAuthentication,)

    def get(self, request):

        data = {}
        question = GlobalSettings.objects.get(id=1).currentQuestion

        data["current_question"] = question.id
        data["text"] = question.text
        data["title"] = question.title
        data["type"] = question.type
        data["answers"] = question.answers
        data["time"] = question.time

        return Response(data, status=status.HTTP_200_OK)

    # def post(self, request):
    #     response = {}
    #     question = GlobalSettings.objects.get(id=1).currentQuestion
    #     question.active = True
    #     question.save()
    #     return Response(response, status=status.HTTP_200_OK)

    # def post(self, request):
    #     direction = request.data["direction"]
    #     global_settings = GlobalSettings.objects.get(id=1)
    #
    #     if direction == "next":
    #         next_question = global_settings.currentQuestion.id + 1
    #     else:
    #         next_question = global_settings.currentQuestion.id - 1
    #
    #     global_settings.currentQuestion = Question.objects.get(id=next_question)
    #     global_settings.save()
    #     return Response({"new_question": next_question}, status=status.HTTP_200_OK)


def landing_page(request):
    return render(request, "fabrikots/index.html")
