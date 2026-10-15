from .models import Run,PushupActivity,UserActivity
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
class Runrepo:
    def create(self,**data):
        return Run.objects.create(**data)
    def get_user_runs(self,user):
        return Run.objects.filter(user=user)

    def get_best_run(self,user,distance):
        return(Run.objects.filter(user=user,
                                  target_distance=distance
                                    )

               .order_by("duration").first())



#push up repo
class PushupRepo:
    def create(self,**data):
        return PushupActivity.objects.create(**data)

    def get_recent_activities(self, user):
        return PushupActivity.objects.filter(
            user=user
        ).order_by("-created_at")[:5]

#for profile 
class ProfileRepo:
    def get_profile(self,user):
        return user 
    def get_total_run_distance(self, user):
        cs=Run.objects.filter(user=user).aggregate(
            total=Sum("actual_distance")
        )
        return cs ["total"] or 0
    
    def get_total_pushups(self, user):
        total_pushup=PushupActivity.objects.filter(user=user).aggregate(
            total=Sum("actual_reps")
        )
        return total_pushup ["total"] or 0
#we exclute this method from profile repo 
    def update_last_active(self, user):
        activity,created =UserActivity.objects.get_or_create(user=user)
        now = timezone.now()
        if (
            activity.last_active_at is None
            or now - activity.last_active_at >= timedelta(minutes=15)
        ):
            activity.last_active_at = now
            activity.save(update_fields=["last_active_at"])

        return activity.last_active_at

    def get_last_active(self, user):
        activity=UserActivity.objects.filter(user=user).first()
        if activity is None:
            return None 
        return activity.last_active_at

       

