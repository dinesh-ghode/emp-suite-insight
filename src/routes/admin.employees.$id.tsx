import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Pencil, Trash2, Mail, Phone, MapPin, User } from "lucide-react";
import { deleteEmployee, getEmployee, calcAge, type Employee } from "@/lib/employee-store";

export const Route = createFileRoute("/admin/employees/$id")({
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState<Employee | undefined>();

  useEffect(() => setEmp(getEmployee(id)), [id]);

  if (!emp) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">Employee not found.</p>
        <Link
          to="/admin/employees"
          className="mt-3 inline-block text-sm font-semibold text-indigo-600"
        >
          ← Back to list
        </Link>
      </div>
    );
  }

  const age = calcAge(emp.dob);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/employees"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{emp.name || "—"}</h2>
          <p className="text-sm text-slate-500">
            {emp.employeeCode || "—"} · {emp.employments[0]?.designation || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/employees/$id/edit"
            params={{ id: emp.id }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
          <button
            onClick={() => {
              if (confirm("Delete this employee?")) {
                deleteEmployee(emp.id);
                navigate({ to: "/admin/employees" });
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
              {emp.photoBase64 ? (
                <img src={emp.photoBase64} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">{emp.name}</p>
              <p className="text-xs text-slate-500">
                {emp.gender} · {age != null ? `${age} yrs` : "—"} · {emp.bloodGroup || "—"}
              </p>
              <p className="text-xs text-slate-500">DOB: {emp.dob || "—"}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <Row icon={Mail} text={emp.primaryEmail || "—"} />
            <Row icon={Phone} text={emp.primaryPhone || "—"} />
            <Row icon={MapPin} text={emp.currentAddress || "—"} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Employment ({emp.employments.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1 pr-4">Type</th>
                  <th className="py-1 pr-4">Company</th>
                  <th className="py-1 pr-4">Designation</th>
                  <th className="py-1 pr-4">Department</th>
                  <th className="py-1 pr-4">Location</th>
                  <th className="py-1 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {emp.employments.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-4 capitalize">{e.type}</td>
                    <td className="py-1.5 pr-4">{e.company || "—"}</td>
                    <td className="py-1.5 pr-4">{e.designation || "—"}</td>
                    <td className="py-1.5 pr-4">{e.department || "—"}</td>
                    <td className="py-1.5 pr-4">{e.location || "—"}</td>
                    <td className="py-1.5 pr-4">{e.current ? "Current" : "Previous"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          Family ({emp.familyMembers.length})
        </h3>
        {emp.familyMembers.length === 0 ? (
          <p className="text-sm text-slate-400">No family members listed.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {emp.familyMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
                  {m.photoBase64 ? (
                    <img src={m.photoBase64} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium text-slate-900">{m.name || "—"}</p>
                  <p className="truncate text-xs text-slate-500">
                    {m.relation || "—"} · {m.profession || "—"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {m.contact || "—"} {m.dependent && "· Dependent"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <Icon className="h-4 w-4 text-slate-400" />
      <span>{text}</span>
    </div>
  );
}
