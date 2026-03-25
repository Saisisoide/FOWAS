"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(fullName, email, password);
      router.replace("/dashboard");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Unable to create account",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[560px] rounded-[2rem] border border-white/8 bg-[#101621] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-10">
      <div className="mb-8">
        <p className="mono text-xs uppercase tracking-[0.35em] text-[#4f8cff]">
          Provision Operator
        </p>
        <h1 className="mt-4 text-4xl font-bold uppercase tracking-[0.04em] text-white">
          Create your reliability workspace
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Register a user account, then continue into the dashboard to create your
          first organisation, workflow, and incident stream.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="mono text-xs uppercase tracking-[0.24em] text-slate-400">
            Full Name
          </label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="fowas-input w-full"
            placeholder="Reliability Operator"
            required
          />
        </div>
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
            minLength={6}
            className="fowas-input w-full"
            placeholder="At least 6 characters"
            required
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className="fowas-button w-full px-5 py-4">
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-[#71a0ff]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
