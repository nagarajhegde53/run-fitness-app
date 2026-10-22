from .repositories import Runrepo,PushupRepo,ProfileRepo
from django.utils import timezone
from zoneinfo import ZoneInfo
from datetime import timedelta

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


class ProfileService:
    def __init__(self,repository:ProfileRepo):
        self.repository=repository

    def get_profile(self,user):
        return self.repository.get_profile(user)
    
    def get_total_run_km(self, user):
        meters=self.repository.get_total_run_distance(user)
        km=meters/1000
        return round(km,2 )

    def get_total_pushups(self, user):
        pushups=self.repository.get_total_pushups(user)
        return pushups

    def update_last_active(self, user):
        last=self.repository.update_last_active(user)
        return last

    def get_last_active(self, user):
        last_active=self.repository.get_last_active(user)
        return last_active

    def get_current_streak(self, user):
        run_times, pushup_times = self.repository.get_workout_dates(user)
        all_times = list(run_times) + list(pushup_times)
        india_timezone = ZoneInfo("Asia/Kolkata")
        workout_dates = set()
       
        for timestamp in all_times:
            date= timezone.localdate(timestamp, timezone=india_timezone)
            workout_dates.add(date)
        if not workout_dates:
            return 0
        today=timezone.localdate(timezone=india_timezone)
        last_workout=max(workout_dates)
        days_since_workout = (today - last_workout).days
        if days_since_workout > 1:
              return 0
        streak=0
        current_date = last_workout
        while current_date in workout_dates:
            streak += 1
            current_date -= timedelta(days=1)

        return streak
        
          



        


    
        

        

   