import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  User,
  Briefcase,
  Phone,
  Users,
  ClipboardCheck,
  Upload,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Check,
} from "lucide-react";
import {
  type Employee,
  type EmploymentEntry,
  type FamilyMember,
  calcAge,
  emptyEmployee,
  saveEmployee,
  uid,
} from "@/lib/employee-store";

const STEPS = [
  { key: "basic", label: "Basic", icon: User },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "family", label: "Family", icon: Users },
  { key: "review", label: "Review", icon: ClipboardCheck },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface Props {
  initial?: Employee;
  // Optional: POST endpoint (e.g. Google Apps Script Web App URL)
  apiUrl?: string;
}

export function EmployeeForm({ initial, apiUrl }: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<Employee>(initial ?? emptyEmployee());
  const [step, setStep] = useState<StepKey>("basic");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const age = useMemo(() => calcAge(data.dob), [data.dob]);

  const update = <K extends keyof Employee>(k: K, v: Employee[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  function validateStep(): boolean {
    const e: Record<string, string> = {};
    if (step === "basic") {
      if (!data.name.trim()) e.name = "Name is required";
      if (!data.dob) e.dob = "Date of birth is required";
      if (!data.gender) e.gender = "Select a gender";
      if (!data.photoBase64) e.photo = "Passport photo is required";
    }
    if (step === "employment") {
      const bad = data.employments.find(
        (m) =>
          !m.department.trim() ||
          !m.company.trim() ||
          !m.designation.trim() ||
          !m.location.trim(),
      );
      if (bad)
        e.employments =
          "Department, Company, Designation and Location are required for every entry.";
    }
    if (step === "contact") {
      if (!/^\S+@\S+\.\S+$/.test(data.primaryEmail))
        e.primaryEmail = "Valid email required";
      if (!/^\+?[\d\s-]{7,15}$/.test(data.primaryPhone))
        e.primaryPhone = "Valid mobile required";
    }
    if (step === "family") {
      const bad = data.familyMembers.find(
        (m) => !m.name.trim() || !m.profession.trim() || !m.photoBase64,
      );
      if (bad)
        e.familyMembers =
          "Each family member needs a name, profession and photograph.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    const i = Math.min(stepIndex + 1, STEPS.length - 1);
    setStep(STEPS[i].key);
  }
  function prev() {
    const i = Math.max(stepIndex - 1, 0);
    setStep(STEPS[i].key);
  }

  function onPhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("photoBase64", String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const saved = saveEmployee(data);
    if (apiUrl) {
      try {
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saved),
        });
      } catch (err) {
        console.error("Remote sync failed", err);
      }
    }
    setSubmitting(false);
    // Logged-in admins go back to the directory; public submitters return home.
    const { isLoggedIn } = await import("@/lib/auth");
    navigate({ to: isLoggedIn() ? "/admin" : "/" });
  }

  return (
    <div className="space-y-6">
      <Stepper current={stepIndex} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {step === "basic" && (
          <BasicStep
            data={data}
            errors={errors}
            age={age}
            update={update}
            onPhoto={onPhoto}
          />
        )}
        {step === "employment" && <EmploymentStep data={data} setData={setData} errors={errors} />}
        {step === "contact" && (
          <ContactStep data={data} errors={errors} update={update} />
        )}
        {step === "family" && <FamilyStep data={data} setData={setData} errors={errors} />}
        {step === "review" && <ReviewStep data={data} age={age} />}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={prev}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step !== "review" ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Saving…" : "Save Employee"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Stepper ---------- */
function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex w-full items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === current;
        const done = i < current;
        return (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={[
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : done
                    ? "text-indigo-600"
                    : "text-slate-500",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs",
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : done
                      ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px flex-1 bg-slate-200" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Field primitives ---------- */
function Field({
  label,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

/* ---------- Basic Step ---------- */
function BasicStep({
  data,
  errors,
  age,
  update,
  onPhoto,
}: {
  data: Employee;
  errors: Record<string, string>;
  age: number | null;
  update: <K extends keyof Employee>(k: K, v: Employee[K]) => void;
  onPhoto: (f?: File) => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div>
      <SectionHead title="Basic Details" subtitle="Personal information on record." />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" required error={errors.name}>
          <input
            className={inputCls}
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>

        <Field label="Full Name (as per records)">
          <input
            className={inputCls}
            value={data.fullName}
            onChange={(e) => update("fullName", e.target.value)}
          />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <select
            className={inputCls}
            value={data.gender}
            onChange={(e) => update("gender", e.target.value as Employee["gender"])}
          >
            <option value="">Select…</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Date of Birth" required error={errors.dob}>
          <input
            type="date"
            className={inputCls}
            value={data.dob}
            onChange={(e) => update("dob", e.target.value)}
          />
        </Field>
        <Field label="Age">
          <input
            className={`${inputCls} bg-slate-50`}
            value={age != null ? `${age} years` : ""}
            readOnly
            placeholder="Auto-calculated"
          />
        </Field>
        <Field label="Blood Group">
          <select
            className={inputCls}
            value={data.bloodGroup}
            onChange={(e) => update("bloodGroup", e.target.value)}
          >
            <option value="">Select…</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Family Member Count">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={data.familyMemberCount}
            onChange={(e) =>
              update("familyMemberCount", Number(e.target.value) || 0)
            }
          />
        </Field>
      </div>

      <div className="mt-6">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Passport Photo <span className="text-rose-500">*</span>
        </span>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onPhoto(e.dataTransfer.files?.[0]);
          }}
          className={[
            "flex items-center gap-5 rounded-xl border-2 border-dashed p-5 transition",
            drag ? "border-indigo-400 bg-indigo-50/60" : "border-slate-200 bg-slate-50/60",
          ].join(" ")}
        >
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
            {data.photoBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photoBase64} alt="passport" className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-slate-300" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-slate-500">PNG / JPG · stored as base64</p>
            <div className="mt-2 flex gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
                <Upload className="h-3.5 w-3.5" /> Choose file
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPhoto(e.target.files?.[0] ?? undefined)}
                />
              </label>
              {data.photoBase64 && (
                <button
                  type="button"
                  onClick={() => update("photoBase64", "")}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>
        {errors.photo && (
          <p className="mt-1 text-xs text-rose-600">{errors.photo}</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Employment Step ---------- */
function EmploymentStep({
  data,
  setData,
  errors,
}: {
  data: Employee;
  setData: React.Dispatch<React.SetStateAction<Employee>>;
  errors: Record<string, string>;
}) {
  const setEmp = (id: string, patch: Partial<EmploymentEntry>) =>
    setData((d) => ({
      ...d,
      employments: d.employments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const add = () =>
    setData((d) => ({
      ...d,
      employments: [
        ...d.employments,
        {
          id: uid(),
          type: "service",
          department: "",
          company: "",
          designation: "",
          grade: "",
          location: "",
          current: false,
          visitingCardBase64: "",
        },
      ],
    }));

  const remove = (id: string) =>
    setData((d) => ({ ...d, employments: d.employments.filter((e) => e.id !== id) }));

  return (
    <div>
      <SectionHead
        title="Employment Details"
        subtitle="Current and previous engagements."
        action={
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add Job
          </button>
        }
      />

      <div className="space-y-4">
        {data.employments.map((emp, i) => (
          <div
            key={emp.id}
            className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  #{i + 1}
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                  {(["service", "business"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEmp(emp.id, { type: t })}
                      className={[
                        "rounded-md px-3 py-1 text-xs font-medium capitalize transition",
                        emp.type === t
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={emp.current}
                    onChange={(e) => setEmp(emp.id, { current: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Currently working here
                </label>
              </div>
              {data.employments.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(emp.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Department" required>
                <input
                  className={inputCls}
                  value={emp.department}
                  onChange={(e) => setEmp(emp.id, { department: e.target.value })}
                />
              </Field>
              <Field label="Company / Organization" required>
                <input
                  className={inputCls}
                  value={emp.company}
                  onChange={(e) => setEmp(emp.id, { company: e.target.value })}
                />
              </Field>
              <Field label="Designation" required>
                <input
                  className={inputCls}
                  value={emp.designation}
                  onChange={(e) => setEmp(emp.id, { designation: e.target.value })}
                />
              </Field>
              <Field label="Job Location" required>
                <input
                  className={inputCls}
                  value={emp.location}
                  onChange={(e) => setEmp(emp.id, { location: e.target.value })}
                />
              </Field>
            </div>
            <VisitingCardUpload
              value={emp.visitingCardBase64}
              onChange={(v) => setEmp(emp.id, { visitingCardBase64: v })}
            />
          </div>
        ))}
        {errors.employments && (
          <p className="text-xs text-rose-600">{errors.employments}</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Contact Step ---------- */
function ContactStep({
  data,
  errors,
  update,
}: {
  data: Employee;
  errors: Record<string, string>;
  update: <K extends keyof Employee>(k: K, v: Employee[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHead title="Contact Details" subtitle="How to reach this employee." />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Primary Email" required error={errors.primaryEmail}>
          <input
            type="email"
            className={inputCls}
            value={data.primaryEmail}
            onChange={(e) => update("primaryEmail", e.target.value)}
          />
        </Field>
        <Field label="Secondary Email">
          <input
            type="email"
            className={inputCls}
            value={data.secondaryEmail}
            onChange={(e) => update("secondaryEmail", e.target.value)}
          />
        </Field>
        <Field label="Primary Mobile" required error={errors.primaryPhone}>
          <input
            className={inputCls}
            value={data.primaryPhone}
            onChange={(e) => update("primaryPhone", e.target.value)}
            placeholder="+91 98xxxxxxxx"
          />
        </Field>
        <Field label="Alternate Mobile">
          <input
            className={inputCls}
            value={data.secondaryPhone}
            onChange={(e) => update("secondaryPhone", e.target.value)}
          />
        </Field>
        <Field label="Current Address" className="sm:col-span-2">
          <textarea
            rows={3}
            className={inputCls}
            value={data.currentAddress}
            onChange={(e) => update("currentAddress", e.target.value)}
          />
        </Field>
        <Field label="Permanent Address" className="sm:col-span-2">
          <textarea
            rows={3}
            className={inputCls}
            value={data.permanentAddress}
            onChange={(e) => update("permanentAddress", e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Emergency Contact</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name">
            <input
              className={inputCls}
              value={data.emergencyContactName}
              onChange={(e) => update("emergencyContactName", e.target.value)}
            />
          </Field>
          <Field label="Relation">
            <input
              className={inputCls}
              value={data.emergencyContactRelation}
              onChange={(e) => update("emergencyContactRelation", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputCls}
              value={data.emergencyContactPhone}
              onChange={(e) => update("emergencyContactPhone", e.target.value)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ---------- Family Step ---------- */
function FamilyStep({
  data,
  setData,
  errors,
}: {
  data: Employee;
  setData: React.Dispatch<React.SetStateAction<Employee>>;
  errors: Record<string, string>;
}) {
  const add = () =>
    setData((d) => ({
      ...d,
      familyMembers: [
        ...d.familyMembers,
        {
          id: uid(),
          name: "",
          relation: "",
          profession: "",
          photoBase64: "",
          dob: "",
          contact: "",
          dependent: false,
          working: false,
          department: "",
          company: "",
          designation: "",
          location: "",
          visitingCardBase64: "",
        },
      ],

    }));

  const setRow = (id: string, patch: Partial<FamilyMember>) =>
    setData((d) => ({
      ...d,
      familyMembers: d.familyMembers.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));

  const remove = (id: string) =>
    setData((d) => ({ ...d, familyMembers: d.familyMembers.filter((m) => m.id !== id) }));

  const onPhoto = (id: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRow(id, { photoBase64: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <SectionHead
        title="Family Details"
        subtitle="Spouse, children, parents and dependents. Photo is mandatory for each member."
        action={
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add Member
          </button>
        }
      />

      {errors.familyMembers && (
        <p className="mb-3 text-xs font-medium text-rose-600">{errors.familyMembers}</p>
      )}

      {data.familyMembers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-8 text-center text-sm text-slate-400">
          No family members yet. Click <b>Add Member</b> to start.
        </div>
      ) : (
        <div className="space-y-4">
          {data.familyMembers.map((m, i) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  Member #{i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="shrink-0">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {m.photoBase64 ? (
                      <img src={m.photoBase64} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <label className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
                    <Upload className="h-3 w-3" /> Photo *
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPhoto(m.id, e.target.files?.[0] ?? undefined)}
                    />
                  </label>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Name" required>
                    <input
                      className={inputCls}
                      value={m.name}
                      onChange={(e) => setRow(m.id, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="Relation" required>
                    <input
                      className={inputCls}
                      value={m.relation}
                      onChange={(e) => setRow(m.id, { relation: e.target.value })}
                      placeholder="Spouse / Child / Parent…"
                    />
                  </Field>
                  <Field label="Profession" required>
                    <input
                      className={inputCls}
                      value={m.profession}
                      onChange={(e) => setRow(m.id, { profession: e.target.value })}
                      placeholder="Doctor / Student / Homemaker…"
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <input
                      type="date"
                      className={inputCls}
                      value={m.dob}
                      onChange={(e) => setRow(m.id, { dob: e.target.value })}
                    />
                  </Field>
                  <Field label="Contact">
                    <input
                      className={inputCls}
                      value={m.contact}
                      onChange={(e) => setRow(m.id, { contact: e.target.value })}
                    />
                  </Field>
                  <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={m.dependent}
                      onChange={(e) => setRow(m.id, { dependent: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Dependent
                  </label>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">Is working?</span>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {[
                      { v: true, label: "Yes" },
                      { v: false, label: "No" },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setRow(m.id, { working: opt.v })}
                        className={[
                          "rounded-md px-3 py-1 text-xs font-medium transition",
                          m.working === opt.v
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {m.working && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Department">
                      <input
                        className={inputCls}
                        value={m.department}
                        onChange={(e) => setRow(m.id, { department: e.target.value })}
                      />
                    </Field>
                    <Field label="Company / Organization">
                      <input
                        className={inputCls}
                        value={m.company}
                        onChange={(e) => setRow(m.id, { company: e.target.value })}
                      />
                    </Field>
                    <Field label="Designation">
                      <input
                        className={inputCls}
                        value={m.designation}
                        onChange={(e) => setRow(m.id, { designation: e.target.value })}
                      />
                    </Field>
                    <Field label="Job Location">
                      <input
                        className={inputCls}
                        value={m.location}
                        onChange={(e) => setRow(m.id, { location: e.target.value })}
                      />
                    </Field>
                  </div>
                )}
                {m.working && (
                  <div className="mt-4">
                    <VisitingCardUpload
                      value={m.visitingCardBase64}
                      onChange={(v) => setRow(m.id, { visitingCardBase64: v })}
                    />
                  </div>
                )}
              </div>

            </div>

          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Review Step ---------- */
function ReviewStep({ data, age }: { data: Employee; age: number | null }) {
  return (
    <div className="space-y-6">
      <SectionHead title="Review" subtitle="Confirm before saving." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {data.photoBase64 ? (
                <img src={data.photoBase64} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                {data.name || "Unnamed"}
              </p>
              <p className="text-xs text-slate-500">
                {data.gender || "—"}
              </p>

              <p className="text-xs text-slate-500">
                {age != null ? `${age} yrs` : "—"} · {data.bloodGroup || "—"}
              </p>
            </div>
          </div>
        </div>

        <ReviewCard title="Contact" className="lg:col-span-2">
          <KV k="Email" v={data.primaryEmail} />
          <KV k="Mobile" v={data.primaryPhone} />
          <KV k="Alt Email" v={data.secondaryEmail} />
          <KV k="Alt Mobile" v={data.secondaryPhone} />
          <KV k="Current" v={data.currentAddress} />
          <KV k="Permanent" v={data.permanentAddress} />
          <KV
            k="Emergency"
            v={`${data.emergencyContactName || "—"} (${data.emergencyContactRelation || "—"}) · ${data.emergencyContactPhone || "—"}`}
          />
        </ReviewCard>
      </div>

      <ReviewCard title={`Employment (${data.employments.length})`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1 pr-4">Type</th>
                <th className="py-1 pr-4">Company</th>
                <th className="py-1 pr-4">Designation</th>
                <th className="py-1 pr-4">Dept</th>
                <th className="py-1 pr-4">Location</th>
                <th className="py-1 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.employments.map((e) => (
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
      </ReviewCard>

      <ReviewCard title={`Family (${data.familyMembers.length})`}>
        {data.familyMembers.length === 0 ? (
          <p className="text-sm text-slate-400">No family members listed.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.familyMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2">
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
      </ReviewCard>
    </div>
  );
}

function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ReviewCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <h4 className="mb-3 text-sm font-semibold text-slate-900">{title}</h4>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="text-right font-medium text-slate-800">{v || "—"}</span>
    </div>
  );
}

// suppress unused import warning
void useEffect;

/* ---------- Visiting Card Upload ---------- */
function VisitingCardUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handle = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className="mt-4 flex items-center gap-4 rounded-lg border border-dashed border-slate-200 bg-white p-3">
      <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        {value ? (
          <img src={value} alt="visiting card" className="h-full w-full object-cover" />
        ) : (
          <Briefcase className="h-6 w-6 text-slate-300" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-700">Visiting Card</p>
        <p className="text-xs text-slate-500">Upload a photo of the visiting card (optional).</p>
        <div className="mt-2 flex gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">
            <Upload className="h-3 w-3" /> {value ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handle(e.target.files?.[0] ?? undefined)}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
