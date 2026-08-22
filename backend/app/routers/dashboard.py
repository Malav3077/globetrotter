from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import City, Trip, User
from app.routers.budget import activity_cost, build_budget
from app.routers.trips import owned_trip
from app.schemas import (
    CityOut,
    DashboardStats,
    ItineraryActivity,
    ItineraryDay,
    TripItinerary,
    TripOut,
)
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trips = db.query(Trip).filter(Trip.user_id == user.id).all()

    upcoming = sorted([t for t in trips if t.status == "upcoming"], key=lambda t: t.start_date)
    recent = sorted(trips, key=lambda t: t.created_at, reverse=True)[:6]
    popular = db.query(City).order_by(City.popularity.desc()).limit(8).all()

    total_cost = sum(build_budget(t).total for t in trips)

    return DashboardStats(
        upcoming_trips=[TripOut.model_validate(t) for t in upcoming[:5]],
        recent_trips=[TripOut.model_validate(t) for t in recent],
        popular_cities=[CityOut.model_validate(c) for c in popular],
        total_trips=len(trips),
        total_planned_cost=round(total_cost, 2),
    )


@router.get("/trips/{trip_id}/itinerary", response_model=TripItinerary)
def itinerary(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Day-by-day view: which city, which activities, what it costs."""
    trip = owned_trip(trip_id, user, db)

    day_city, day_acts, day_cost = {}, {}, {}

    for stop in trip.stops:
        nights = max((stop.end_date - stop.start_date).days, 1)
        spread = (float(stop.transport_cost) + float(stop.accommodation_cost)
                  + float(stop.meal_cost)) / nights

        for i in range(nights):
            day = stop.start_date + timedelta(days=i)
            day_city[day] = (stop.city.name, stop.city.country)
            day_cost[day] = day_cost.get(day, 0) + spread

        for link in stop.activities:
            day = link.scheduled_at.date() if link.scheduled_at else stop.start_date
            day_city.setdefault(day, (stop.city.name, stop.city.country))
            day_acts.setdefault(day, []).append(
                ItineraryActivity(
                    id=link.id, name=link.activity.name, category=link.activity.category,
                    cost=activity_cost(link), duration_mins=link.activity.duration_mins,
                    scheduled_at=link.scheduled_at, notes=link.notes,
                )
            )
            day_cost[day] = day_cost.get(day, 0) + activity_cost(link)

    total_days = (trip.end_date - trip.start_date).days + 1
    days = []
    for i in range(total_days):
        day = trip.start_date + timedelta(days=i)
        city, country = day_city.get(day, (None, None))
        days.append(ItineraryDay(
            day=day, day_number=i + 1, city=city, country=country,
            activities=day_acts.get(day, []), day_cost=round(day_cost.get(day, 0), 2),
        ))

    return TripItinerary(trip_id=trip.id, trip_name=trip.name,
                         start_date=trip.start_date, end_date=trip.end_date, days=days)
