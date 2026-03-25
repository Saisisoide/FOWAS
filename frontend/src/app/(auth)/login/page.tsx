"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to sign in",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[520px] rounded-[2rem] border border-white/8 bg-[#101621] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-10">
      <div className="mb-8">
        <p className="mono text-xs uppercase tracking-[0.35em] text-[#4f8cff]">
          Operator Login
        </p>
        <h1 className="mt-4 text-4xl font-bold uppercase tracking-[0.04em] text-white">
          Access the cockpit
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Sign in to review incidents, manage workflows, and monitor reliability metrics.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Email
          </label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="fowas-input w-full"
            placeholder="operator@fowas.dev"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Password
          </label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="fowas-input w-full"
            placeholder="••••••••"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className="fowas-button w-full px-5 py-4">
          {submitting ? "Authorizing..." : "Enter FOWAS"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        New operator?{" "}
        <Link href="/register" className="font-semibold text-[#71a0ff]">
          Create an account
        </Link>
      </p>
    </div>
  );
}
