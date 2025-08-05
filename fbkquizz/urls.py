from django.urls import path, re_path
from . import views

urlpatterns = [
    path("", views.landing_page, name="Fabrikots"),
    path("game-info", views.GameUsersInfo.as_view(), name="GameUserInfo"),
    path("update-user", views.UpdateGameUser.as_view(), name="GameUserInfo"),
    path("get-question", views.Questions.as_view(), name="Questions"),
    path("accept-answer", views.AcceptAnswer.as_view(), name="AcceptAnswer"),
    path("delete-answers", views.DeleteAnswersByQuestionId.as_view(), name="DeleteAnswers"),
    # Catch-all for React Router (must be last)
    re_path(r'^(?!api/|admin/|static/|media/).*$', views.landing_page, name="react_catchall"),
]