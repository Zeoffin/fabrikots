from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth import get_user_model
from user_api.serializers import UserSerializer
from .models import UserSettings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

UserModel = get_user_model()


class GameUsersInfo(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (SessionAuthentication,)

    def get(self, request):

        response = {}

        users = UserModel.objects.all()
        for user in users:
            try:
                user_setting = UserSettings.objects.get(user=user)
                response[user.username] = {
                    "active": user_setting.active,
                    "points": user_setting.points
                }
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
        pass


def landing_page(request):
    return render(request, "fabrikots/index.html")
