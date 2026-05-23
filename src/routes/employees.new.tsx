import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ChevronLeft } from "lucide-react";
import { EmployeeForm } from "@/components/employee/EmployeeForm";

export const Route = createFileRoute("/employees/new")({
  component: PublicAddEmployee,
  head: () => ({
    meta: [
      { title: "Add Employee — PeopleHub" },
      {
        name: "description",
        content: "Submit employee details to PeopleHub.",
      },
    ],
  }),
});

function PublicAddEmployee() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">PeopleHub</p>
              <p className="text-[11px] text-slate-500">Employee Submission</p>
            </div>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8 md:py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Add Employee
          </h2>
          <p className="text-sm text-slate-500">
            Capture employee details. No login required.
          </p>
        </div>
        <EmployeeForm />
      </main>
    </div>
  );
}
