import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Scale,
  LayoutDashboard,
  FolderOpen,
  FileUp,
  Search,
  Gavel,
  FileSignature,
  CalendarClock,
  BookOpen,
  Radio,
  Swords,
  Settings as SettingsIcon,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_SECTIONS: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
    ],
  },
  {
    heading: "Build",
    items: [
      { to: "/case", label: "Case Builder", icon: FolderOpen },
      { to: "/documents", label: "Docs & Intake", icon: FileUp },
      { to: "/theory", label: "Case Theory", icon: Scale },
    ],
  },
  {
    heading: "Research & Draft",
    items: [
      { to: "/research", label: "Legal Research", icon: Search },
      { to: "/arguments", label: "Arguments", icon: Gavel },
      { to: "/forms", label: "Court Forms", icon: FileSignature },
      { to: "/deadlines", label: "Deadlines", icon: CalendarClock },
    ],
  },
  {
    heading: "Practice",
    items: [
      { to: "/guide", label: "Rights & Objections", icon: BookOpen },
      { to: "/hearing", label: "Hearing Mode", icon: Radio },
      { to: "/mock", label: "Mock Hearing", icon: Swords },
    ],
  },
  {
    items: [
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_SECTIONS.map((section, si) => (
        <div key={si} className={si > 0 ? "mt-3" : ""}>
          {section.heading && (
            <div className="mb-1 px-3.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              {section.heading}
            </div>
          )}
          {section.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brass-400/15 text-brass-200"
                    : "text-ink-300 hover:bg-ink-800/70 hover:text-ink-100"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brass-400 text-ink-950">
        <Scale size={20} />
      </span>
      <div className="leading-tight">
        <div className="font-serif text-lg font-bold text-ink-50">Pro Se</div>
        <div className="text-[10px] uppercase tracking-widest text-ink-400">
          Defend yourself
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-ink-800 bg-ink-900/50 p-4 lg:flex">
        <Brand />
        <NavItems />
        <div className="mt-auto rounded-xl border border-ink-800 bg-ink-950/50 p-3 text-[11px] leading-snug text-ink-400">
          Educational tool — <span className="text-ink-300">not legal advice</span>. Verify
          everything with your court's rules.
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-800 bg-ink-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <Brand />
          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-ghost !px-2.5 !py-2"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {open && (
          <div className="border-b border-ink-800 bg-ink-900/95 p-3 lg:hidden">
            <NavItems onNavigate={() => setOpen(false)} />
          </div>
        )}

        <main key={loc.pathname} className="mx-auto w-full max-w-5xl flex-1 animate-fade-in p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
