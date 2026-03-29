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
      <div className="mono text-sm uppercase tracking-[0.35em] text-slate-500">
        Initialising FOWAS cockpit...
      </div>
    </main>
  );
}
