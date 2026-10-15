from django.db import models

from django.contrib.auth.models import User




class Run(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="runs"
    )

    target_distance = models.FloatField()
    actual_distance = models.FloatField()
    duration = models.DurationField()

    gps_accuracy = models.FloatField(
        null=True,
        blank=True
    )

    started_at = models.DateTimeField()
    finished_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.actual_distance}m"


   #pushup model
class PushupActivity(models.Model):
    user=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="pushup_activities"
    ) 
    target_reps = models.PositiveIntegerField()
    actual_reps = models.PositiveIntegerField()
    created_at=models.DateTimeField(auto_now_add=True)


#user activity
class UserActivity(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )
    last_active_at = models.DateTimeField(null=True, blank=True)
