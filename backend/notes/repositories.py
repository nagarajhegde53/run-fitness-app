from .models import Run
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
    
    