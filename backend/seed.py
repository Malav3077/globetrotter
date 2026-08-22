"""Seed cities and activities.

Cities are fetched live from the countriesnow API and stored in Postgres,
so the running app never reads a JSON file - it queries the database.
"""

import sys

import httpx

from app.database import Base, SessionLocal, engine
from app.models import Activity, City

CITIES_URL = "https://countriesnow.space/api/v0.1/countries/population/cities"
MAX_CITIES = 400

# Rough cost-of-living index per country (world average = 50).
COST_INDEX = {
    "Switzerland": 96, "Norway": 88, "Iceland": 87, "Denmark": 82, "Singapore": 81,
    "United States of America": 78, "Australia": 76, "Ireland": 75, "Netherlands": 73,
    "Sweden": 72, "United Kingdom of Great Britain and Northern Ireland": 72,
    "Austria": 70, "Finland": 70, "France": 68, "Canada": 68, "Germany": 66,
    "Belgium": 66, "New Zealand": 66, "Japan": 62, "Italy": 62, "Spain": 55,
    "Republic of Korea": 60, "United Arab Emirates": 60, "Portugal": 52,
    "Greece": 50, "Czechia": 48, "Poland": 44, "Croatia": 46, "China": 42,
    "Malaysia": 38, "Thailand": 38, "Turkey": 34, "Brazil": 34, "Mexico": 36,
    "South Africa": 34, "Viet Nam": 32, "Indonesia": 32, "Philippines": 34,
    "Egypt": 26, "India": 24, "Pakistan": 22, "Bangladesh": 24, "Nepal": 26,
    "Sri Lanka": 28, "Nigeria": 28, "Kenya": 30,
}
DEFAULT_COST_INDEX = 45

# name, category, base cost at index 50, duration in minutes
ACTIVITY_TEMPLATES = [
    ("City Walking Tour", "Sightseeing", 15, 120),
    ("Top Landmark Visit", "Sightseeing", 25, 90),
    ("Street Food Tour", "Food", 30, 150),
    ("Local Cooking Class", "Food", 55, 180),
    ("Museum Day Pass", "Culture", 20, 180),
    ("Historic District Tour", "Culture", 18, 120),
    ("Day Hike", "Adventure", 40, 300),
    ("Cycling Tour", "Adventure", 35, 180),
    ("Live Music Evening", "Nightlife", 28, 180),
    ("Botanical Garden", "Nature", 12, 120),
    ("Local Market Visit", "Shopping", 10, 90),
    ("Spa and Wellness", "Relaxation", 60, 120),
]


def latest_population(counts):
    best_year, best_value = None, 0
    for entry in counts or []:
        try:
            year, value = int(entry["year"]), float(entry["value"])
        except (KeyError, TypeError, ValueError):
            continue
        if best_year is None or year > best_year:
            best_year, best_value = year, value
    return best_value


def fetch_cities():
    print("fetching cities from countriesnow api ...")
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        payload = client.get(CITIES_URL).json()

    seen, rows = set(), []
    for item in payload.get("data", []):
        name = (item.get("city") or "").strip().title()
        country = (item.get("country") or "").strip()
        if not name or not country:
            continue
        key = (name.lower(), country.lower())
        if key in seen:
            continue
        seen.add(key)
        rows.append((name, country, latest_population(item.get("populationCounts"))))

    rows.sort(key=lambda r: r[2], reverse=True)
    return rows[:MAX_CITIES]


def popularity_score(rank):
    """Rank 0 -> 100, last rank -> 1."""
    return max(1, int(100 - (rank / MAX_CITIES) * 99))


def seed():
    Base.metadata.create_all(engine)
    db = SessionLocal()

    if db.query(City).count():
        print("cities already seeded, nothing to do")
        db.close()
        return

    rows = fetch_cities()
    if not rows:
        print("no city data received")
        db.close()
        sys.exit(1)

    for rank, (name, country, _pop) in enumerate(rows):
        cost_index = COST_INDEX.get(country, DEFAULT_COST_INDEX)
        city = City(
            name=name,
            country=country,
            region=country,
            cost_index=cost_index,
            popularity=popularity_score(rank),
            image_url=f"https://picsum.photos/seed/{name.lower().replace(' ', '-')}/600/400",
        )
        db.add(city)
        db.flush()

        scale = cost_index / 50
        for title, category, base_cost, duration in ACTIVITY_TEMPLATES:
            db.add(
                Activity(
                    city_id=city.id,
                    name=f"{title} in {name}",
                    category=category,
                    cost=round(base_cost * scale, 2),
                    duration_mins=duration,
                    description=f"{title} experience in {name}, {country}.",
                    image_url=f"https://picsum.photos/seed/{category.lower()}-{city.id}/400/300",
                )
            )

    db.commit()
    print(f"seeded {db.query(City).count()} cities, {db.query(Activity).count()} activities")
    db.close()


if __name__ == "__main__":
    seed()
