from django.db import models
from django.db import models
from django.contrib.auth.models import User


# class Note(models.Model):
#     user = models.ForeignKey(
#         User,
#         on_delete=models.CASCADE,
#         related_name="notes"
#     )

#     title = models.CharField(max_length=200)

#     content = models.TextField()

#     created_at = models.DateTimeField(auto_now_add=True)

#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return self.title

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
    
