import { AppShell } from "@/components/ui/app-shell";
import { GlobalFiltersProvider } from "@/hooks/useGlobalFilters";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalFiltersProvider>
      <AppShell>{children}</AppShell>
    </GlobalFiltersProvider>
  );
}
