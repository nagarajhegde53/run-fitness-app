from django.shortcuts import render
from .serializers import RunSerializer
from .repositories import Runrepo
from .services import RunService



from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .serializers import RegisterSerializer
from .serializers import LoginSerializer
from django.contrib.auth import logout
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework import status

        #register api and view 
class Register(APIView):
    def post(self,request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "User registered successfully"
                },
                status=201
            )
        return Response(serializer.errors,status=400)
    
class Login(APIView):
    def post(self,request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username=serializer.validated_data["username"]
            password =serializer.validated_data["password"]
            user=authenticate(
                username=username,
                password=password
            )
            if user is not None:
                login(request,user)
                return Response(
                    {
                    "message":"login success"
                    }
                )
            return Response(
                {
                    "error": "Invalid Credentials"
                },
                status=401
            )
        return Response(serializer.errors, status=400)


class Logout(APIView):
    def post(self,request):
        logout(request)
        return Response(
            {
                "message":"Logged out successfully"
            }
        )



#view is http controller 
class RunView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        serializer=RunSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        repository=Runrepo()
        service=RunService(repository)
        run=service.create_run(request.user,
                               serializer.validated_data
                               )
        return Response(RunSerializer(run).data,
                        status=status.HTTP_201_CREATED)


    #get request
    def get(self, request):

        repository = Runrepo()
        service = RunService(repository)

        runs = service.get_user_runs(request.user)

        serializer = RunSerializer(runs, many=True)

        return Response(serializer.data)

    # best run view 
class BestRunView(APIView):
        permission_classes=[IsAuthenticated]
        def get(self,request):
            distance=request.query_params.get("distance")
            if not distance:
                return Response(   {"error": "distance is required"},
                status=status.HTTP_400_BAD_REQUEST)

            try:
                distance=float(distance)
            except  ValueError:
                 return Response(
                {"error": "distance must be a number"},
                status=status.HTTP_400_BAD_REQUEST
            )

            repository=Runrepo()
            service=RunService(repository)
            run=service.get_best_run(
                request.user,
                distance
            )

            if not run:
                return Response(
                {"message": "No runs found for this distance"},
                status=status.HTTP_404_NOT_FOUND
            )
            seralizer=RunSerializer(run)
            return Response(seralizer.data,
                            status=status.HTTP_200_OK)



    







# from django.http import JsonResponse
# from django.views.decorators.csrf import ensure_csrf_cookie
# from django.utils.decorators import method_decorator
# from rest_framework.views import APIView

# @method_decorator(ensure_csrf_cookie, name="dispatch")
# class CSRF(APIView):

#     def get(self, request):
#         return JsonResponse({"message": "CSRF Cookie Set"})
    
from django.http import JsonResponse
from django.middleware.csrf import get_token
from rest_framework.views import APIView


class CSRF(APIView):

    def get(self, request):
        token = get_token(request)

        return JsonResponse({
            "csrfToken": token
        })
