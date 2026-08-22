from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)
    phone: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=80)
    country: str | None = Field(default=None, max_length=80)

    @field_validator("first_name", "last_name")
    @classmethod
    def not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("must not be blank")
        return v.strip() if v else v

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, v: str | None) -> str | None:
        if v and not v.replace("+", "").replace(" ", "").replace("-", "").isdigit():
            raise ValueError("phone must contain digits only")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    first_name: str
    last_name: str | None
    phone: str | None
    city: str | None
    country: str | None
    photo_url: str | None
    is_admin: bool
    created_at: datetime


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)
    phone: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=80)
    country: str | None = Field(default=None, max_length=80)
    photo_url: str | None = Field(default=None, max_length=500)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country: str
    region: str | None
    cost_index: float
    popularity: int
    image_url: str | None


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    city_id: int
    name: str
    category: str
    cost: float
    duration_mins: int
    description: str | None
    image_url: str | None


class TripCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    start_date: date
    end_date: date
    cover_photo: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def dates_in_order(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class TripUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    cover_photo: str | None = Field(default=None, max_length=500)
    is_public: bool | None = None


class StopCreate(BaseModel):
    city_id: int
    start_date: date
    end_date: date
    order_index: int = 0
    transport_cost: float = Field(default=0, ge=0)
    accommodation_cost: float = Field(default=0, ge=0)
    meal_cost: float = Field(default=0, ge=0)

    @model_validator(mode="after")
    def dates_in_order(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class StopUpdate(BaseModel):
    city_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    order_index: int | None = None
    transport_cost: float | None = Field(default=None, ge=0)
    accommodation_cost: float | None = Field(default=None, ge=0)
    meal_cost: float | None = Field(default=None, ge=0)


class StopActivityCreate(BaseModel):
    activity_id: int
    scheduled_at: datetime | None = None
    cost_override: float | None = Field(default=None, ge=0)
    notes: str | None = None


class StopActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activity_id: int
    scheduled_at: datetime | None
    cost_override: float | None
    notes: str | None
    activity: ActivityOut


class StopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    city_id: int
    start_date: date
    end_date: date
    order_index: int
    transport_cost: float
    accommodation_cost: float
    meal_cost: float
    city: CityOut
    activities: list[StopActivityOut] = []


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    description: str | None
    start_date: date
    end_date: date
    cover_photo: str | None
    is_public: bool
    share_slug: str | None
    created_at: datetime


class TripDetail(TripOut):
    stops: list[StopOut] = []
