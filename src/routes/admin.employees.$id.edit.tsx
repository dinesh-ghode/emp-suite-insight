import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { EmployeeForm } from "@/components/employee/EmployeeForm";
import { getEmployee, type Employee } from "@/lib/employee-store";

export const Route = createFileRoute("/admin/employees/$id/edit")({
  component: EditEmployee,
});

function EditEmployee() {
  const { id } = Route.useParams();
  const [emp, setEmp] = useState<Employee | undefined>();
  useEffect(() => setEmp(getEmployee(id)), [id]);

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/admin/employees/$id"
          params={{ id }}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Edit Employee</h2>
      </div>
      {emp ? (
        <EmployeeForm initial={emp} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Employee not found.
        </div>
      )}
    </div>
  );
}
