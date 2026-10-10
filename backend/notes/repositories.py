from .models import Run,PushupActivity
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
