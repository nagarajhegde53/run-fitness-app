from django.urls import path
from .views import Register
from .views import  Logout
from .views import Login
from .views import CSRF
from .models import Run
from .views import RunView, BestRunView
from .views import (
    Register,
    Login,
    Logout,
    CSRF,
    RunView,
    BestRunView,
)
from .views import MeView



urlpatterns = [
    
    path("register/", Register.as_view()),
     path("login/", Login.as_view()),
     
    path("logout/", Logout.as_view()),
    path("csrf/", CSRF.as_view()),
    path("me/", MeView.as_view()),
    path("runs/", RunView.as_view(), name="runs"),
     path("runs/best/", BestRunView.as_view(), name="best-run"),


]
