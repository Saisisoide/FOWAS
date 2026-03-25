import type { ReactNode } from "react";

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function DashboardIcon() {
  return (
    <IconWrap>
      <path d="M4 4h6v6H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 14h6v6H4z" />
    </IconWrap>
  );
}

export function IncidentIcon() {
  return (
    <IconWrap>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconWrap>
  );
}

export function WorkflowIcon() {
  return (
    <IconWrap>
      <path d="M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      <path d="M18 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      <path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
      <path d="M8 6h3l5 6" />
      <path d="M12 18v-4" />
    </IconWrap>
  );
}

export function AnalyticsIcon() {
  return (
    <IconWrap>
      <path d="M5 20V8" />
      <path d="M12 20V4" />
      <path d="M19 20v-9" />
      <path d="M3 20h18" />
    </IconWrap>
  );
}

export function OrganisationIcon() {
  return (
    <IconWrap>
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
    </IconWrap>
  );
}

export function SettingsIcon() {
  return (
    <IconWrap>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="m4.93 4.93 2.12 2.12" />
      <path d="m16.95 16.95 2.12 2.12" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="m4.93 19.07 2.12-2.12" />
      <path d="m16.95 7.05 2.12-2.12" />
      <circle cx="12" cy="12" r="3.5" />
    </IconWrap>
  );
}

export function ProfileIcon() {
  return (
    <IconWrap>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconWrap>
  );
}

export function SearchIcon() {
  return (
    <IconWrap>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </IconWrap>
  );
}

export function BellIcon() {
  return (
    <IconWrap>
      <path d="M15 17H9" />
      <path d="M18 17V11a6 6 0 1 0-12 0v6l-2 2h16l-2-2Z" />
    </IconWrap>
  );
}

export function HelpIcon() {
  return (
    <IconWrap>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 4.1 2c-.72.62-1.6 1.2-1.6 2.5" />
      <path d="M12 17h.01" />
    </IconWrap>
  );
}

export function PlusIcon() {
  return (
    <IconWrap>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconWrap>
  );
}

export function TerminalIcon() {
  return (
    <IconWrap>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m7 10 2 2-2 2" />
      <path d="M11 16h5" />
    </IconWrap>
  );
}
