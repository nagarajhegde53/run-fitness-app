from .repositories import Runrepo

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
        return self.repository.get_best_runs(user,distance)
   