"""Create a demo account with realistic trips, for screenshots and the demo video.

    python seed_demo.py
"""

from datetime import date, timedelta

from app.database import SessionLocal
from app.models import Activity, City, StopActivity, Trip, TripStop, User
from app.security import hash_password

EMAIL = "demo@globetrotter.app"
PASSWORD = "demo1234"

# name, description, days from today, [(city query, nights, transport, stay, meals)]
TRIPS = [
    ("Europe Summer 2026", "Two weeks across Europe with friends.", 30, 180, [
        ("Paris", 6, 320, 700, 280),
        ("Roma", 7, 180, 620, 300),
    ]),
    ("Japan in Autumn", "Chasing the maple leaves.", 90, 220, [
        ("Tokyo", 5, 850, 640, 320),
        ("Osaka", 4, 120, 400, 240),
    ]),
    ("Goa Weekend", "Short beach reset.", -40, 90, [
        ("Mumbai (Bombay)", 3, 90, 210, 130),
    ]),
]


def find_city(db, name):
    return db.query(City).filter(City.name.ilike(f"%{name}%")).order_by(City.popularity.desc()).first()


def main():
    db = SessionLocal()

    if db.query(User).filter(User.email == EMAIL).first():
        print(f"{EMAIL} already exists, nothing to do")
        db.close()
        return

    user = User(
        email=EMAIL,
        password_hash=hash_password(PASSWORD),
        first_name="Malav",
        last_name="Parekh",
        phone="+91 90000 00000",
        city="Ahmedabad",
        country="India",
        is_admin=True,
    )
    db.add(user)
    db.flush()

    for name, description, offset, budget, stops in TRIPS:
        start = date.today() + timedelta(days=offset)
        total_nights = sum(s[1] for s in stops)

        trip = Trip(
            user_id=user.id, name=name, description=description,
            start_date=start, end_date=start + timedelta(days=total_nights),
            daily_budget=budget,
        )
        db.add(trip)
        db.flush()

        cursor = start
        for index, (city_name, nights, transport, stay, meals) in enumerate(stops):
            city = find_city(db, city_name)
            if not city:
                print(f"  skipped {city_name} - not in the city table")
                continue

            stop = TripStop(
                trip_id=trip.id, city_id=city.id,
                start_date=cursor, end_date=cursor + timedelta(days=nights),
                order_index=index, transport_cost=transport,
                accommodation_cost=stay, meal_cost=meals,
            )
            db.add(stop)
            db.flush()

            activities = (
                db.query(Activity).filter(Activity.city_id == city.id)
                .order_by(Activity.cost).limit(4).all()
            )
            for offset_days, activity in enumerate(activities):
                db.add(StopActivity(
                    stop_id=stop.id, activity_id=activity.id,
                    scheduled_at=None if offset_days >= nights else None,
                ))

            cursor += timedelta(days=nights)

        print(f"  created {name} with {len(stops)} stops")

    # share the first trip so the public page and community feed have content
    first = db.query(Trip).filter(Trip.user_id == user.id).order_by(Trip.id).first()
    first.is_public = True
    first.share_slug = "europe-summer-demo"

    db.commit()
    print(f"\ndemo account ready:  {EMAIL} / {PASSWORD}  (admin)")
    print(f"public itinerary:    /share/{first.share_slug}")
    db.close()


if __name__ == "__main__":
    main()
