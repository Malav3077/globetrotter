import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import StopActivity, Trip, TripStop, User
from app.routers.budget import build_budget
from app.schemas import CommunityTrip, PublicTrip, TripOut
from app.security import get_current_user

router = APIRouter(prefix="/api/public", tags=["public"])


def public_trip(slug: str, db: Session) -> Trip:
    trip = db.query(Trip).filter(Trip.share_slug == slug, Trip.is_public.is_(True)).first()
    if not trip:
        raise HTTPException(404, "Shared trip not found")
    return trip


@router.get("/trips/{slug}", response_model=PublicTrip)
def view_shared_trip(slug: str, db: Session = Depends(get_db)):
    """No auth - anyone with the link can read this itinerary."""
    trip = public_trip(slug, db)
    owner = f"{trip.user.first_name} {trip.user.last_name or ''}".strip()
    return PublicTrip(trip=trip, owner_name=owner, budget=build_budget(trip))


@router.post("/trips/{slug}/copy", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def copy_trip(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    source = public_trip(slug, db)

    copy = Trip(
        user_id=user.id,
        name=f"{source.name} (copy)",
        description=source.description,
        start_date=source.start_date,
        end_date=source.end_date,
        cover_photo=source.cover_photo,
        daily_budget=source.daily_budget,
        is_public=False,
        share_slug=None,
    )
    db.add(copy)
    db.flush()

    for stop in source.stops:
        new_stop = TripStop(
            trip_id=copy.id, city_id=stop.city_id,
            start_date=stop.start_date, end_date=stop.end_date,
            order_index=stop.order_index, transport_cost=stop.transport_cost,
            accommodation_cost=stop.accommodation_cost, meal_cost=stop.meal_cost,
        )
        db.add(new_stop)
        db.flush()
        for link in stop.activities:
            db.add(StopActivity(stop_id=new_stop.id, activity_id=link.activity_id,
                                scheduled_at=link.scheduled_at,
                                cost_override=link.cost_override, notes=link.notes))

    db.commit()
    db.refresh(copy)
    return copy


@router.delete("/trips/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def unshare(slug: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.share_slug == slug).first()
    if not trip or trip.user_id != user.id:
        raise HTTPException(404, "Trip not found")
    trip.is_public = False
    db.commit()


@router.get("/community", response_model=list[CommunityTrip])
def community_feed(
    db: Session = Depends(get_db),
    q: str | None = None,
    country: str | None = None,
    sort_by: str = Query("created_at", pattern="^(created_at|start_date|name)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    """Every publicly shared itinerary, browsable by anyone."""
    query = db.query(Trip).filter(Trip.is_public.is_(True), Trip.share_slug.isnot(None))
    if q:
        query = query.filter(Trip.name.ilike(f"%{q}%"))

    column = getattr(Trip, sort_by)
    trips = query.order_by(column.desc() if order == "desc" else column.asc()).all()

    rows = []
    for trip in trips:
        cities = [s.city.name for s in trip.stops]
        if country and not any(s.city.country == country for s in trip.stops):
            continue
        rows.append(
            CommunityTrip(
                slug=trip.share_slug,
                name=trip.name,
                description=trip.description,
                owner_name=f"{trip.user.first_name} {trip.user.last_name or ''}".strip(),
                start_date=trip.start_date,
                end_date=trip.end_date,
                city_count=len(cities),
                cities=cities[:4],
                total_cost=build_budget(trip).total,
            )
        )
    return rows
