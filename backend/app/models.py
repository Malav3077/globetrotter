from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    country: Mapped[str | None] = mapped_column(String(80), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_admin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    trips: Mapped[list["Trip"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class City(Base):
    """Seeded reference data - searched, never created by users."""

    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    country: Mapped[str] = mapped_column(String(80), index=True)
    region: Mapped[str | None] = mapped_column(String(80), nullable=True)
    cost_index: Mapped[float] = mapped_column(Numeric(6, 2), default=0)
    popularity: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    activities: Mapped[list["Activity"]] = relationship(back_populates="city")


class Activity(Base):
    """Seeded reference data - things to do in a city."""

    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    category: Mapped[str] = mapped_column(String(60), index=True)
    cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    duration_mins: Mapped[int] = mapped_column(Integer, default=60)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    city: Mapped["City"] = relationship(back_populates="activities")


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    cover_photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(default=False)
    share_slug: Mapped[str | None] = mapped_column(String(40), unique=True, index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="trips")
    stops: Mapped[list["TripStop"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="TripStop.order_index"
    )


class TripStop(Base):
    """One city visit inside a trip. Non-activity costs live here."""

    __tablename__ = "trip_stops"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    transport_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    accommodation_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    meal_cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    trip: Mapped["Trip"] = relationship(back_populates="stops")
    city: Mapped["City"] = relationship()
    activities: Mapped[list["StopActivity"]] = relationship(
        back_populates="stop", cascade="all, delete-orphan"
    )


class StopActivity(Base):
    """An activity scheduled at a stop. cost_override wins over the catalog cost."""

    __tablename__ = "stop_activities"
    __table_args__ = (UniqueConstraint("stop_id", "activity_id", name="uq_stop_activity"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    stop_id: Mapped[int] = mapped_column(ForeignKey("trip_stops.id", ondelete="CASCADE"), index=True)
    activity_id: Mapped[int] = mapped_column(ForeignKey("activities.id", ondelete="RESTRICT"))
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cost_override: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    stop: Mapped["TripStop"] = relationship(back_populates="activities")
    activity: Mapped["Activity"] = relationship()
