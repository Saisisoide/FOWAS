"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/services/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="skeleton h-1.5 w-32 rounded-full" />
        <p className="text-xs text-slate-500">Initializing…</p>
      </div>
    </main>
  );
}
