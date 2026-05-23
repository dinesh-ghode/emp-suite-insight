import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, UserPlus, Building2, LogOut, Home } from "lucide-react";
import { isLoggedIn, logout } from "@/lib/auth";

const nav = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/admin", label: "Directory", icon: LayoutDashboard, exact: true },
  { to: "/admin/employees", label: "All Employees", icon: Users, exact: false },
  { to: "/employees/new", label: "Add Employee", icon: UserPlus, exact: true },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate({ to: "/login" });
    } else {
      setReady(true);
    }
  }, [navigate, path]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <Link to="/admin" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">PeopleHub</p>
            <p className="text-[11px] text-slate-500">Employee Directory</p>
          </div>
        </Link>
        <nav className="space-y-1">
          {nav.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-semibold text-slate-700">Signed in as</p>
            <p className="text-slate-500">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur md:px-8">
          <h1 className="text-sm font-semibold text-slate-700">Admin</h1>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1 md:hidden">
              {nav.map((n) => {
                const active = n.exact ? path === n.to : path.startsWith(n.to);
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={[
                      "rounded-md p-2",
                      active ? "bg-indigo-50 text-indigo-700" : "text-slate-500",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 md:hidden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>
        <div className="px-5 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
