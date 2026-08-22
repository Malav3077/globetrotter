"use client";

import Link from "next/link";
import { useState } from "react";

import AuthCard from "@/components/AuthCard";
import ErrorText from "@/components/ErrorText";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to keep planning your trips.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <ErrorText message={error} />
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" required value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="input" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand-700 hover:underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}
