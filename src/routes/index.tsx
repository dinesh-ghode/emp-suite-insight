import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ArrowRight, Users, Briefcase, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "PeopleHub — Employee Management System" },
      {
        name: "description",
        content:
          "Employee directory to manage existing employee records: profiles, employment, contacts and family details.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">PeopleHub</span>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Open Admin <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            Employee Management System
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            A clean admin panel for your existing employee records.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            Capture, organise and review employee profiles — basic info, employment
            history, contacts and family — all in one focused workspace.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Go to Admin Panel <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/employees/new"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Add Employee
            </Link>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Centralised records",
              text: "All employees in one searchable directory with quick actions.",
            },
            {
              icon: Briefcase,
              title: "Employment details",
              text: "Track current and previous engagements for every employee in the directory.",
            },
            {
              icon: ShieldCheck,
              title: "Admin-only workspace",
              text: "Designed as an internal admin panel — not a self-registration form.",
            },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
