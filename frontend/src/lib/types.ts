export type User = {
  id: number; email: string; first_name: string; last_name: string | null;
  phone: string | null; city: string | null; country: string | null;
  photo_url: string | null; is_admin: boolean; created_at: string;
};

export type City = {
  id: number; name: string; country: string; region: string | null;
  cost_index: number; popularity: number; image_url: string | null;
};

export type Activity = {
  id: number; city_id: number; name: string; category: string;
  cost: number; duration_mins: number; description: string | null; image_url: string | null;
};

export type TripStatus = "ongoing" | "upcoming" | "completed";

export type Trip = {
  id: number; user_id: number; name: string; description: string | null;
  start_date: string; end_date: string; cover_photo: string | null;
  daily_budget: number | null; is_public: boolean; share_slug: string | null;
  created_at: string; status: TripStatus;
};

export type StopActivity = {
  id: number; activity_id: number; scheduled_at: string | null;
  cost_override: number | null; notes: string | null; activity: Activity;
};

export type Stop = {
  id: number; city_id: number; start_date: string; end_date: string;
  order_index: number; transport_cost: number; accommodation_cost: number;
  meal_cost: number; city: City; activities: StopActivity[];
};

export type TripDetail = Trip & { stops: Stop[] };

export type GroupCount = { key: string; count: number };
export type Page<T> = { items: T[]; total: number; page: number; page_size: number; groups: GroupCount[] };

export type Budget = {
  trip_id: number; trip_name: string; total: number;
  breakdown: { transport: number; accommodation: number; meals: number; activities: number };
  total_days: number; average_per_day: number; daily_budget: number | null;
  by_city: { city: string; country: string; nights: number; total: number }[];
  daily: { day: string; city: string | null; cost: number; over_budget: boolean }[];
  over_budget_days: number;
};

export type ItineraryDay = {
  day: string; day_number: number; city: string | null; country: string | null;
  day_cost: number;
  activities: { id: number; name: string; category: string; cost: number;
                duration_mins: number; scheduled_at: string | null; notes: string | null }[];
};

export type Itinerary = {
  trip_id: number; trip_name: string; start_date: string; end_date: string; days: ItineraryDay[];
};

export type Dashboard = {
  upcoming_trips: Trip[]; recent_trips: Trip[]; popular_cities: City[];
  total_trips: number; total_planned_cost: number;
};

export type PublicTrip = { trip: TripDetail; owner_name: string; budget: Budget };

export type CommunityTrip = {
  slug: string; name: string; description: string | null; owner_name: string;
  start_date: string; end_date: string; city_count: number;
  cities: string[]; total_cost: number;
};

export type NameCount = { name: string; extra: string | null; count: number };
export type MonthCount = { month: string; count: number };

export type AdminStats = {
  total_users: number; total_trips: number; total_stops: number;
  total_activities_booked: number; public_trips: number;
  avg_trip_days: number; total_planned_cost: number;
  popular_cities: NameCount[]; popular_activities: NameCount[];
  trips_per_month: MonthCount[];
};

export type AdminUser = {
  id: number; email: string; first_name: string; last_name: string | null;
  city: string | null; country: string | null; is_admin: boolean;
  created_at: string; trip_count: number;
};
