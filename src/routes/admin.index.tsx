import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Users,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { listEmployees, type Employee } from "@/lib/employee-store";

export const Route = createFileRoute("/admin/")({
  component: Directory,
});

function Directory() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => setEmps(listEmployees()), []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    emps.forEach((e) =>
      e.employments.forEach((emp) => emp.department && set.add(emp.department)),
    );
    return Array.from(set).sort();
  }, [emps]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return emps.filter((e) => {
      const matchesQ =
        !s ||
        e.name.toLowerCase().includes(s) ||
        e.employeeCode.toLowerCase().includes(s) ||
        e.primaryEmail.toLowerCase().includes(s) ||
        (e.employments[0]?.designation ?? "").toLowerCase().includes(s) ||
        (e.employments[0]?.department ?? "").toLowerCase().includes(s);
      const matchesDept =
        !dept || e.employments.some((emp) => emp.department === dept);
      return matchesQ && matchesDept;
    });
  }, [emps, q, dept]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Employee Directory
          </h2>
          <p className="text-sm text-slate-500">
            {emps.length} employee{emps.length === 1 ? "" : "s"} ·{" "}
            {departments.length} department{departments.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          to="/employees/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" /> Add Employee
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, code, designation, email…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${view === "grid" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setView("list")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${view === "list" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">No employees to show</p>
          <p className="max-w-xs text-xs text-slate-500">
            {emps.length === 0
              ? "Add your first employee record to populate the directory."
              : "No results match your filters."}
          </p>
          {emps.length === 0 && (
            <Link
              to="/employees/new"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Employee
            </Link>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => (
            <DirectoryCard key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Designation</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/employees/$id"
                      params={{ id: e.id }}
                      className="flex items-center gap-3"
                    >
                      <Avatar emp={e} size={9} />
                      <div>
                        <p className="font-medium text-slate-900">{e.name || "—"}</p>
                        <p className="text-xs text-slate-500">{e.employeeCode || "—"}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {e.employments[0]?.designation || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {e.employments[0]?.department || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{e.primaryEmail || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{e.primaryPhone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DirectoryCard({ e }: { e: Employee }) {
  const role = e.employments[0];
  return (
    <Link
      to="/admin/employees/$id"
      params={{ id: e.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="h-16 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
      <div className="-mt-8 flex flex-col items-center px-5 pb-5 text-center">
        <Avatar emp={e} size={16} ring />
        <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">
          {e.name || "Unnamed"}
        </p>
        <p className="line-clamp-1 text-xs text-slate-500">
          {role?.designation || "—"}
        </p>
        {role?.department && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            <Briefcase className="h-3 w-3" /> {role.department}
          </span>
        )}
        <div className="mt-4 w-full space-y-1.5 border-t border-slate-100 pt-3 text-left text-xs text-slate-600">
          <Row icon={Mail} text={e.primaryEmail} />
          <Row icon={Phone} text={e.primaryPhone} />
          <Row icon={MapPin} text={role?.location} />
        </div>
      </div>
    </Link>
  );
}

function Row({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span className="truncate">{text || "—"}</span>
    </div>
  );
}

function Avatar({
  emp,
  size = 9,
  ring = false,
}: {
  emp: Employee;
  size?: 9 | 16;
  ring?: boolean;
}) {
  const cls = size === 16 ? "h-16 w-16" : "h-9 w-9";
  return (
    <div
      className={`${cls} overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 ${ring ? "ring-4 ring-white shadow-sm" : ""}`}
    >
      {emp.photoBase64 ? (
        <img src={emp.photoBase64} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-indigo-700">
          {(emp.name || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}
