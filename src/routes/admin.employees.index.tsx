import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Pencil, Trash2, Eye } from "lucide-react";
import {
  deleteEmployee,
  listEmployees,
  syncFromRemote,
  type Employee,
} from "@/lib/employee-store";
import { hasApi, setApiUrl, getApiUrl } from "@/lib/api";

export const Route = createFileRoute("/admin/employees/")({
  component: EmployeesList,
});

function EmployeesList() {
  const [emps, setEmps] = useState<Employee[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setEmps(listEmployees());
    if (hasApi()) syncFromRemote().then(setEmps);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return emps;
    return emps.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.employeeCode.toLowerCase().includes(s) ||
        e.primaryEmail.toLowerCase().includes(s) ||
        e.employments[0]?.designation.toLowerCase().includes(s),
    );
  }, [emps, q]);

  function handleDelete(id: string) {
    if (!confirm("Delete this employee record?")) return;
    deleteEmployee(id);
    setEmps(listEmployees());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Employees</h2>
          <p className="text-sm text-slate-500">
            {emps.length} record{emps.length === 1 ? "" : "s"} on file.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const cur = getApiUrl();
              const v = prompt("Google Apps Script Web App URL:", cur);
              if (v !== null) {
                setApiUrl(v.trim());
                syncFromRemote().then(setEmps);
              }
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            title="Configure Google Sheet API URL"
          >
            {hasApi() ? "Sheet: Connected" : "Connect Sheet"}
          </button>
          <Link
            to="/employees/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, code, email, designation…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Designation</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Mobile</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    No employees match your search.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-100">
                        {e.photoBase64 ? (
                          <img
                            src={e.photoBase64}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                            {e.name.slice(0, 1).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{e.name || "—"}</p>
                        <p className="text-xs text-slate-500">
                          {e.gender || "—"} · {e.bloodGroup || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{e.employeeCode || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {e.employments[0]?.designation || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{e.primaryEmail || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{e.primaryPhone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to="/admin/employees/$id"
                        params={{ id: e.id }}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to="/admin/employees/$id/edit"
                        params={{ id: e.id }}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
