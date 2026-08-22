import secrets
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, City, StopActivity, Trip, TripStop, User
from app.schemas import (
    StopActivityCreate,
    StopActivityOut,
    StopCreate,
    StopOut,
    StopUpdate,
    TripCreate,
    TripDetail,
    TripOut,
    TripUpdate,
)
from app.security import get_current_user

router = APIRouter(prefix="/api", tags=["trips"])


def owned_trip(trip_id: int, user: User, db: Session) -> Trip:
    trip = db.get(Trip, trip_id)
    if not trip or trip.user_id != user.id:
        raise HTTPException(404, "Trip not found")
    return trip


def owned_stop(stop_id: int, user: User, db: Session) -> TripStop:
    stop = db.get(TripStop, stop_id)
    if not stop or stop.trip.user_id != user.id:
        raise HTTPException(404, "Stop not found")
    return stop


def check_within_trip(trip: Trip, start: date, end: date):
    if start < trip.start_date or end > trip.end_date:
        raise HTTPException(400, "Stop dates must fall inside the trip dates")


@router.post("/trips", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = Trip(user_id=user.id, **payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/trips", response_model=list[TripOut])
def list_trips(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    q: str | None = None,
    trip_status: str | None = Query(None, pattern="^(ongoing|upcoming|completed)$"),
    sort_by: str = Query("start_date", pattern="^(name|start_date|end_date|created_at)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    query = db.query(Trip).filter(Trip.user_id == user.id)
    if q:
        query = query.filter(Trip.name.ilike(f"%{q}%"))

    column = getattr(Trip, sort_by)
    trips = query.order_by(column.desc() if order == "desc" else column.asc()).all()

    if trip_status:
        trips = [t for t in trips if t.status == trip_status]
    return trips


@router.get("/trips/{trip_id}", response_model=TripDetail)
def get_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return owned_trip(trip_id, user, db)


@router.patch("/trips/{trip_id}", response_model=TripOut)
def update_trip(trip_id: int, payload: TripUpdate,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = owned_trip(trip_id, user, db)
    data = payload.model_dump(exclude_unset=True)

    start = data.get("start_date", trip.start_date)
    end = data.get("end_date", trip.end_date)
    if end < start:
        raise HTTPException(400, "end_date cannot be before start_date")

    for field, value in data.items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(owned_trip(trip_id, user, db))
    db.commit()


@router.post("/trips/{trip_id}/share", response_model=TripOut)
def share_trip(trip_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = owned_trip(trip_id, user, db)
    trip.is_public = True
    if not trip.share_slug:
        trip.share_slug = secrets.token_urlsafe(8)
    db.commit()
    db.refresh(trip)
    return trip


@router.post("/trips/{trip_id}/stops", response_model=StopOut, status_code=status.HTTP_201_CREATED)
def add_stop(trip_id: int, payload: StopCreate,
             user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = owned_trip(trip_id, user, db)
    if not db.get(City, payload.city_id):
        raise HTTPException(404, "City not found")
    check_within_trip(trip, payload.start_date, payload.end_date)

    if payload.order_index == 0:
        payload.order_index = len(trip.stops)

    stop = TripStop(trip_id=trip.id, **payload.model_dump())
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return stop


@router.patch("/stops/{stop_id}", response_model=StopOut)
def update_stop(stop_id: int, payload: StopUpdate,
                user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stop = owned_stop(stop_id, user, db)
    data = payload.model_dump(exclude_unset=True)

    if data.get("city_id") and not db.get(City, data["city_id"]):
        raise HTTPException(404, "City not found")

    start = data.get("start_date", stop.start_date)
    end = data.get("end_date", stop.end_date)
    if end < start:
        raise HTTPException(400, "end_date cannot be before start_date")
    check_within_trip(stop.trip, start, end)

    for field, value in data.items():
        setattr(stop, field, value)
    db.commit()
    db.refresh(stop)
    return stop


@router.delete("/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(stop_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(owned_stop(stop_id, user, db))
    db.commit()


@router.post("/trips/{trip_id}/reorder", response_model=list[StopOut])
def reorder_stops(trip_id: int, stop_ids: list[int],
                  user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = owned_trip(trip_id, user, db)
    existing = {s.id for s in trip.stops}
    if set(stop_ids) != existing:
        raise HTTPException(400, "stop_ids must contain every stop of this trip exactly once")

    for index, stop_id in enumerate(stop_ids):
        db.get(TripStop, stop_id).order_index = index
    db.commit()
    db.refresh(trip)
    return trip.stops


@router.post("/stops/{stop_id}/activities", response_model=StopActivityOut,
             status_code=status.HTTP_201_CREATED)
def add_activity(stop_id: int, payload: StopActivityCreate,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stop = owned_stop(stop_id, user, db)
    activity = db.get(Activity, payload.activity_id)
    if not activity:
        raise HTTPException(404, "Activity not found")
    if activity.city_id != stop.city_id:
        raise HTTPException(400, "Activity does not belong to this stop's city")

    exists = db.query(StopActivity).filter_by(stop_id=stop.id, activity_id=activity.id).first()
    if exists:
        raise HTTPException(409, "Activity already added to this stop")

    link = StopActivity(stop_id=stop.id, **payload.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/stop-activities/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_activity(link_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    link = db.get(StopActivity, link_id)
    if not link or link.stop.trip.user_id != user.id:
        raise HTTPException(404, "Not found")
    db.delete(link)
    db.commit()
