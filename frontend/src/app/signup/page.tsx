"use client";

import Link from "next/link";
import { useState } from "react";

import AuthCard from "@/components/AuthCard";
import ErrorText from "@/components/ErrorText";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "",
    phone: "", city: "", country: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setBusy(true);
    try {
      await signup({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Start planning trips in a minute.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ErrorText message={error} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="label">First name *</label>
            <input id="first_name" required value={form.first_name}
                   onChange={set("first_name")} className="input" />
          </div>
          <div>
            <label htmlFor="last_name" className="label">Last name</label>
            <input id="last_name" value={form.last_name} onChange={set("last_name")} className="input" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="label">Email *</label>
          <input id="email" type="email" required value={form.email}
                 onChange={set("email")} className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password *</label>
          <input id="password" type="password" required minLength={8} value={form.password}
                 onChange={set("password")} className="input" placeholder="At least 8 characters" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input id="phone" value={form.phone} onChange={set("phone")} className="input" placeholder="+91 …" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="label">City</label>
            <input id="city" value={form.city} onChange={set("city")} className="input" />
          </div>
          <div>
            <label htmlFor="country" className="label">Country</label>
            <input id="country" value={form.country} onChange={set("country")} className="input" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
      </p>
    </AuthCard>
  );
}
