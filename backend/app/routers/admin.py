from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, City, StopActivity, Trip, TripStop, User
from app.routers.budget import build_budget
from app.schemas import AdminStats, AdminUserRow, MonthCount, NameCount
from app.security import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Same as get_current_user, but refuses anyone without the admin flag."""
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user


@router.get("/stats", response_model=AdminStats)
def stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    trips = db.query(Trip).all()

    popular_cities = (
        db.query(City.name, City.country, func.count(TripStop.id))
        .join(TripStop, TripStop.city_id == City.id)
        .group_by(City.name, City.country)
        .order_by(func.count(TripStop.id).desc())
        .limit(8)
        .all()
    )

    popular_activities = (
        db.query(Activity.name, Activity.category, func.count(StopActivity.id))
        .join(StopActivity, StopActivity.activity_id == Activity.id)
        .group_by(Activity.name, Activity.category)
        .order_by(func.count(StopActivity.id).desc())
        .limit(8)
        .all()
    )

    per_month = (
        db.query(func.to_char(Trip.created_at, "YYYY-MM"), func.count(Trip.id))
        .group_by(func.to_char(Trip.created_at, "YYYY-MM"))
        .order_by(func.to_char(Trip.created_at, "YYYY-MM"))
        .all()
    )

    days = [(t.end_date - t.start_date).days + 1 for t in trips]

    return AdminStats(
        total_users=db.query(func.count(User.id)).scalar() or 0,
        total_trips=len(trips),
        total_stops=db.query(func.count(TripStop.id)).scalar() or 0,
        total_activities_booked=db.query(func.count(StopActivity.id)).scalar() or 0,
        public_trips=sum(1 for t in trips if t.is_public),
        avg_trip_days=round(sum(days) / len(days), 1) if days else 0,
        total_planned_cost=round(sum(build_budget(t).total for t in trips), 2),
        popular_cities=[NameCount(name=n, extra=c, count=k) for n, c, k in popular_cities],
        popular_activities=[NameCount(name=n, extra=c, count=k) for n, c, k in popular_activities],
        trips_per_month=[MonthCount(month=m, count=c) for m, c in per_month],
    )


@router.get("/users", response_model=list[AdminUserRow])
def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    q: str | None = None,
    sort_by: str = Query("created_at", pattern="^(created_at|email|first_name)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
):
    query = db.query(User)
    if q:
        query = query.filter(User.email.ilike(f"%{q}%") | User.first_name.ilike(f"%{q}%"))

    column = getattr(User, sort_by)
    users = query.order_by(column.desc() if order == "desc" else column.asc()).all()

    counts = dict(db.query(Trip.user_id, func.count(Trip.id)).group_by(Trip.user_id).all())
    rows = []
    for u in users:
        row = AdminUserRow.model_validate(u)
        row.trip_count = counts.get(u.id, 0)
        rows.append(row)
    return rows
