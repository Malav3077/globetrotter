from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Trip, User
from app.routers.trips import owned_trip
from app.schemas import BudgetBreakdown, CityCost, DayCost, TripBudget
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["budget"])


def activity_cost(link) -> float:
    """cost_override wins over the catalog price."""
    return float(link.cost_override if link.cost_override is not None else link.activity.cost)


def build_budget(trip: Trip) -> TripBudget:
    transport = accommodation = meals = activities = 0.0
    by_city: list[CityCost] = []
    per_day: dict = defaultdict(float)
    day_city: dict = {}

    for stop in trip.stops:
        nights = max((stop.end_date - stop.start_date).days, 1)
        days = [stop.start_date + timedelta(days=i) for i in range(nights)]

        stop_transport = float(stop.transport_cost)
        stop_stay = float(stop.accommodation_cost)
        stop_meals = float(stop.meal_cost)
        stop_acts = sum(activity_cost(link) for link in stop.activities)

        transport += stop_transport
        accommodation += stop_stay
        meals += stop_meals
        activities += stop_acts

        by_city.append(CityCost(city=stop.city.name, country=stop.city.country,
                                nights=nights,
                                total=round(stop_transport + stop_stay + stop_meals + stop_acts, 2)))

        # spread stop-level costs evenly across its nights
        spread = (stop_transport + stop_stay + stop_meals) / nights
        for day in days:
            per_day[day] += spread
            day_city.setdefault(day, stop.city.name)

        # an activity lands on its scheduled day, otherwise on the stop's first day
        for link in stop.activities:
            day = link.scheduled_at.date() if link.scheduled_at else stop.start_date
            if day not in per_day:
                day_city.setdefault(day, stop.city.name)
            per_day[day] += activity_cost(link)

    total = round(transport + accommodation + meals + activities, 2)
    total_days = (trip.end_date - trip.start_date).days + 1
    limit = float(trip.daily_budget) if trip.daily_budget is not None else None

    daily = [
        DayCost(day=day, city=day_city.get(day), cost=round(cost, 2),
                over_budget=limit is not None and cost > limit)
        for day, cost in sorted(per_day.items())
    ]

    return TripBudget(
        trip_id=trip.id,
        trip_name=trip.name,
        total=total,
        breakdown=BudgetBreakdown(transport=round(transport, 2), accommodation=round(accommodation, 2),
                                  meals=round(meals, 2), activities=round(activities, 2)),
        total_days=total_days,
        average_per_day=round(total / total_days, 2) if total_days else 0,
        daily_budget=limit,
        by_city=by_city,
        daily=daily,
        over_budget_days=sum(1 for d in daily if d.over_budget),
    )


@router.get("/trips/{trip_id}/budget", response_model=TripBudget)
def trip_budget(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_budget(owned_trip(trip_id, user, db))
