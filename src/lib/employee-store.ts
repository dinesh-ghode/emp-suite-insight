// Lightweight client-side store for employee records.
// Swap with API calls (e.g. Google Apps Script Web App) by replacing
// the implementations below — keep the same signatures.

export interface EmploymentEntry {
  id: string;
  type: "service" | "business";
  department: string;
  company: string;
  designation: string;
  grade: string;
  location: string;
  current: boolean;
  visitingCardBase64: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  profession: string;
  photoBase64: string;
  dob: string;
  contact: string;
  dependent: boolean;
  working: boolean;
  department: string;
  company: string;
  designation: string;
  location: string;
  visitingCardBase64: string;
}

export interface Employee {
  id: string;
  // Basic
  employeeCode: string;
  name: string;
  fullName: string;
  gender: "Male" | "Female" | "Other" | "";
  dob: string;
  bloodGroup: string;
  photoBase64: string; // data URL
  familyMemberCount: number;
  // Employment (current + past)
  employments: EmploymentEntry[];
  // Contact
  primaryEmail: string;
  secondaryEmail: string;
  primaryPhone: string;
  secondaryPhone: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  // Family
  familyMembers: FamilyMember[];
  createdAt: string;
  updatedAt: string;
}

import { api, hasApi } from "./api";

const KEY = "ems.employees.v1";

const isBrowser = () => typeof window !== "undefined";

function readCache(): Employee[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Employee[]) : [];
  } catch {
    return [];
  }
}

function writeCache(all: Employee[]) {
  if (isBrowser()) localStorage.setItem(KEY, JSON.stringify(all));
}

export function listEmployees(): Employee[] {
  return readCache();
}

export function getEmployee(id: string): Employee | undefined {
  return readCache().find((e) => e.id === id);
}

/** Pulls from Google Sheet (if configured) and refreshes local cache. */
export async function syncFromRemote(): Promise<Employee[]> {
  if (!hasApi()) return readCache();
  try {
    const res = await api.list();
    const data: Employee[] = Array.isArray(res) ? res : res.data || [];
    writeCache(data);
    return data;
  } catch (e) {
    console.error("syncFromRemote failed", e);
    return readCache();
  }
}

export function saveEmployee(emp: Employee): Employee {
  const all = readCache();
  const idx = all.findIndex((e) => e.id === emp.id);
  const now = new Date().toISOString();
  const next: Employee = { ...emp, updatedAt: now, createdAt: emp.createdAt || now };
  if (idx === -1) all.unshift(next);
  else all[idx] = next;
  writeCache(all);
  if (hasApi()) api.save(next).catch((e) => console.error("api.save failed", e));
  return next;
}

export function deleteEmployee(id: string) {
  writeCache(readCache().filter((e) => e.id !== id));
  if (hasApi()) api.remove(id).catch((e) => console.error("api.delete failed", e));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function calcAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function emptyEmployee(): Employee {
  return {
    id: uid(),
    employeeCode: "",
    name: "",
    fullName: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    photoBase64: "",
    familyMemberCount: 0,
    employments: [
      {
        id: uid(),
        type: "service",
        department: "",
        company: "",
        designation: "",
        grade: "",
        location: "",
        current: true,
        visitingCardBase64: "",
      },
    ],
    primaryEmail: "",
    secondaryEmail: "",
    primaryPhone: "",
    secondaryPhone: "",
    currentAddress: "",
    permanentAddress: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
    familyMembers: [],
    createdAt: "",
    updatedAt: "",
  };
}
