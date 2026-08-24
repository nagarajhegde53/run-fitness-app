from rest_framework import serializers
from .models import Run

from django.contrib.auth.models import User




class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=["username",
                "email",
                "password"]

    def create(self,validated_data):
            user=User.objects.create_user(

            username=validated_data["username"],

            email=validated_data["email"],

            password=validated_data["password"]

        )

            return user
        

class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()

    password = serializers.CharField()


class RunSerializer(serializers.ModelSerializer):
    class Meta:
        model=Run
        fields=["id", "target_distance",
            "actual_distance",
            "duration",
            "gps_accuracy",
            "started_at",
            "finished_at",
            "created_at",]
        read_only_fields=["id","creted_at",]

    def validate_target_distance(self, value ):
         if value <= 0:
              raise serializers.ValidationError( "Target distance must be greater than 0.")
         return value
    
    def validate_actual_distance(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Actual distance cannot be negative."
            )
        return value

    def validate_gps_accuracy(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "GPS accuracy cannot be negative."
            )
        return value

     
