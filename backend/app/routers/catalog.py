from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Activity, City
from app.schemas import ActivityOut, ActivityPage, CityOut, CityPage, GroupCount

router = APIRouter(prefix="/api", tags=["catalog"])

CITY_SORTS = {"name": City.name, "country": City.country,
              "cost_index": City.cost_index, "popularity": City.popularity}
ACTIVITY_SORTS = {"name": Activity.name, "category": Activity.category,
                  "cost": Activity.cost, "duration": Activity.duration_mins}


def apply_sort(query, columns, sort_by, order):
    column = columns.get(sort_by)
    if column is None:
        raise HTTPException(400, f"sort_by must be one of {sorted(columns)}")
    return query.order_by(column.desc() if order == "desc" else column.asc())


def group_counts(db, base_query, column):
    rows = base_query.with_entities(column, func.count()).group_by(column).order_by(func.count().desc()).all()
    return [GroupCount(key=str(k), count=c) for k, c in rows]


@router.get("/cities", response_model=CityPage)
def list_cities(
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="search by city name"),
    country: str | None = None,
    max_cost_index: float | None = Query(None, ge=0),
    sort_by: str = "popularity",
    order: str = Query("desc", pattern="^(asc|desc)$"),
    group_by: str | None = Query(None, pattern="^(country|region)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = db.query(City)
    if q:
        query = query.filter(City.name.ilike(f"%{q}%"))
    if country:
        query = query.filter(City.country == country)
    if max_cost_index is not None:
        query = query.filter(City.cost_index <= max_cost_index)

    total = query.count()
    groups = group_counts(db, query, City.country if group_by == "country" else City.region) if group_by else []

    query = apply_sort(query, CITY_SORTS, sort_by, order)
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return CityPage(items=[CityOut.model_validate(c) for c in items],
                    total=total, page=page, page_size=page_size, groups=groups)


@router.get("/cities/countries", response_model=list[str])
def list_countries(db: Session = Depends(get_db)):
    return [r[0] for r in db.query(City.country).distinct().order_by(City.country).all()]


@router.get("/cities/{city_id}", response_model=CityOut)
def get_city(city_id: int, db: Session = Depends(get_db)):
    city = db.get(City, city_id)
    if not city:
        raise HTTPException(404, "City not found")
    return city


@router.get("/activities", response_model=ActivityPage)
def list_activities(
    db: Session = Depends(get_db),
    q: str | None = None,
    city_id: int | None = None,
    category: str | None = None,
    min_cost: float | None = Query(None, ge=0),
    max_cost: float | None = Query(None, ge=0),
    max_duration: int | None = Query(None, ge=0),
    sort_by: str = "cost",
    order: str = Query("asc", pattern="^(asc|desc)$"),
    group_by: str | None = Query(None, pattern="^(category)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    query = db.query(Activity)
    if q:
        query = query.filter(Activity.name.ilike(f"%{q}%"))
    if city_id:
        query = query.filter(Activity.city_id == city_id)
    if category:
        query = query.filter(Activity.category == category)
    if min_cost is not None:
        query = query.filter(Activity.cost >= min_cost)
    if max_cost is not None:
        query = query.filter(Activity.cost <= max_cost)
    if max_duration is not None:
        query = query.filter(Activity.duration_mins <= max_duration)

    total = query.count()
    groups = group_counts(db, query, Activity.category) if group_by else []

    query = apply_sort(query, ACTIVITY_SORTS, sort_by, order)
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return ActivityPage(items=[ActivityOut.model_validate(a) for a in items],
                        total=total, page=page, page_size=page_size, groups=groups)


@router.get("/activities/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    return [r[0] for r in db.query(Activity.category).distinct().order_by(Activity.category).all()]
