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
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[440px] rounded-[var(--radius-xl)] border border-white/[0.06] bg-[#0a0d16] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:p-10">
      <div className="mb-8">
        <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--blue)]">
          Create Account
        </p>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-white">
          Set up your workspace
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
          Register, then create your first organisation and workflow.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-500">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="fowas-input w-full"
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-500">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="fowas-input w-full"
            placeholder="operator@fowas.dev"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-500">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={6}
            className="fowas-input w-full"
            placeholder="At least 6 characters"
            required
          />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-4 py-3 text-[12px] text-red-400">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={submitting} className="fowas-button w-full px-5 py-3">
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-[13px] text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-[var(--blue)] hover:text-white transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
