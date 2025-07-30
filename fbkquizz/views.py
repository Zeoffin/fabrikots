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
        data["notes"] = question.notes
        data["image"] = question.image.url if question.image else None

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


class AcceptAnswer(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (SessionAuthentication,)

    def post(self, request):
        # Only allow admin (markuss) to accept answers
        if request.user.username != "markuss":
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        username = request.data.get("username")
        question_id = request.data.get("question_id")
        
        if not username or not question_id:
            return Response({"error": "Username and question_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = UserModel.objects.get(username=username)
            user_setting = UserSettings.objects.get(user=user)
            question = Question.objects.get(id=question_id)
            
            # Initialize accepted_answers if not exists
            if not user_setting.accepted_answers:
                user_setting.accepted_answers = {}
            
            # Check if answer was already accepted
            if str(question_id) in user_setting.accepted_answers:
                return Response({"error": "Answer already accepted"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark answer as accepted and award points
            user_setting.accepted_answers[str(question_id)] = True
            user_setting.points += question.points
            user_setting.save()
            
            return Response({
                "success": True,
                "username": username,
                "question_id": question_id,
                "points_awarded": question.points,
                "new_total_points": user_setting.points
            }, status=status.HTTP_200_OK)
            
        except UserModel.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except UserSettings.DoesNotExist:
            return Response({"error": "User settings not found"}, status=status.HTTP_404_NOT_FOUND)
        except Question.DoesNotExist:
            return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)


class DeleteAnswersByQuestionId(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    authentication_classes = (SessionAuthentication,)

    def post(self, request):
        # Only allow admin (markuss) to delete answers
        if request.user.username != "markuss":
            return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        
        question_id = request.data.get("question_id")
        
        if not question_id:
            return Response({"error": "question_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get all user settings
            user_settings = UserSettings.objects.all()
            updated_users = []
            
            for user_setting in user_settings:
                # Check if user has answers for this question
                if user_setting.answers and str(question_id) in user_setting.answers:
                    del user_setting.answers[str(question_id)]
                    updated_users.append(user_setting.user.username)
                
                # Check if user has accepted answers for this question and subtract points
                if user_setting.accepted_answers and str(question_id) in user_setting.accepted_answers:
                    del user_setting.accepted_answers[str(question_id)]
                    # Get the question to subtract points
                    question = Question.objects.get(id=question_id)
                    user_setting.points -= question.points
                    # Ensure points don't go negative
                    if user_setting.points < 0:
                        user_setting.points = 0
                
                user_setting.save()
            
            return Response({
                "success": True,
                "question_id": question_id,
                "updated_users": updated_users,
                "message": f"Deleted answers for question {question_id} from all users"
            }, status=status.HTTP_200_OK)
            
        except Question.DoesNotExist:
            return Response({"error": "Question not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def landing_page(request):
    return render(request, "fabrikots/index.html")
