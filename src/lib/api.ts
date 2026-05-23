// Google Apps Script Web App integration.
// Set your deployed Web App URL here OR via localStorage key "ems.api.url".

const DEFAULT_API_URL = ""; // <-- paste your /exec URL here, e.g. "https://script.google.com/macros/s/AKfycb.../exec"

export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("ems.api.url");
    if (saved) return saved;
  }
  return DEFAULT_API_URL;
}

export function setApiUrl(url: string) {
  if (typeof window !== "undefined") localStorage.setItem("ems.api.url", url);
}

export function hasApi(): boolean {
  return !!getApiUrl();
}

async function post(body: unknown) {
  const url = getApiUrl();
  if (!url) throw new Error("API URL not configured");
  // No Content-Type header → avoids CORS preflight on Apps Script.
  const res = await fetch(url, { method: "POST", body: JSON.stringify(body) });
  return res.json();
}

async function get(params: Record<string, string>) {
  const url = getApiUrl();
  if (!url) throw new Error("API URL not configured");
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`);
  return res.json();
}

export const api = {
  list: () => get({ action: "list" }),
  get: (id: string) => get({ action: "get", id }),
  save: (employee: unknown) => post({ action: "save", employee }),
  remove: (id: string) => post({ action: "delete", id }),
};
