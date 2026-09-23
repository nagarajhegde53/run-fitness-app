from .repositories import Runrepo,PushupRepo

class RunService:
    def __init__(self,repository:Runrepo):
        self.repository=repository

    def create_run(self,user,data):
        return self.repository.create(
            user=user,
            **data
        )

    def get_user_runs(self,user):
        return self.repository.get_user_runs(user)
    
    def get_best_run(self,user,distance):
        return self.repository.get_best_run(user,distance)


#push up service 
class PushupService:
    def __init__(self,repository:PushupRepo):
        self.repository=repository

    def create_activity(self,user,data):
        return self.repository.create(user=user,**data)

    def get_recent_activities(self,user):
        return self.repository.get_recent_activities(user)
        

   