/**
 * PeopleHub — Google Apps Script Web App
 * Backend for the Employee Directory app.
 *
 * Stores employee data in a Google Sheet, and uploads any base64 photos
 * (passport photo, employment visiting cards, family photos, family visiting
 * cards) to a Google Drive folder. Only the resulting Drive URLs are stored
 * in the sheet (keeps cells small and shareable).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SETUP — step by step
 * ─────────────────────────────────────────────────────────────────────────
 * 1. Create a new Google Sheet.  Copy its ID from the URL
 *      https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
 * 2. Create a Google Drive folder for photo uploads.  Copy its ID from the
 *    URL: https://drive.google.com/drive/folders/THIS_IS_THE_ID
 * 3. In the Sheet: Extensions → Apps Script.  Replace the default Code.gs
 *    with the contents of THIS file.
 * 4. Set SHEET_ID and DRIVE_FOLDER_ID below.
 * 5. Save.  Run the `setup` function once (Run menu → setup) and click
 *    "Review permissions" → allow access to Sheets + Drive.
 * 6. Deploy → New deployment → ⚙ → Web app
 *      • Description : PeopleHub API
 *      • Execute as  : Me (your account)
 *      • Who has access: Anyone   (required so the app can call it)
 *    Click Deploy → Copy the Web App URL (ends in /exec).
 * 7. In the PeopleHub app open Admin → Employees → "Connect Sheet"
 *    and paste the /exec URL.  Done.
 *
 * To re-deploy after editing this file:
 *    Deploy → Manage deployments → ✏ → Version: New version → Deploy.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ENDPOINTS
 * ─────────────────────────────────────────────────────────────────────────
 *   GET  ?action=list                  → Employee[]
 *   GET  ?action=get&id=EMP_ID         → Employee
 *   POST {action:"save", employee}     → { ok:true, id }
 *   POST {action:"delete", id}         → { ok:true }
 */

/* ============================================================== CONFIG */

const SHEET_ID        = "PUT_YOUR_SHEET_ID_HERE";
const DRIVE_FOLDER_ID = "PUT_YOUR_DRIVE_FOLDER_ID_HERE";

const EMP_SHEET = "Employees";
const FAM_SHEET = "FamilyMembers";

/** Columns written to the Employees sheet (in order). */
const EMP_HEADERS = [
  "id",
  "name",
  "fullName",
  "gender",
  "dob",
  "bloodGroup",
  "photoUrl",                 // Drive URL of passport photo
  "familyMemberCount",
  "employments",              // JSON string (each entry incl. visitingCardUrl)
  "primaryEmail",
  "secondaryEmail",
  "primaryPhone",
  "secondaryPhone",
  "currentAddress",
  "permanentAddress",
  "emergencyContactName",
  "emergencyContactRelation",
  "emergencyContactPhone",
  "createdAt",
  "updatedAt"
];

/** Columns written to the FamilyMembers sheet (in order). */
const FAM_HEADERS = [
  "id",
  "employeeId",
  "name",
  "relation",
  "profession",
  "photoUrl",                 // Drive URL of family member photo
  "dob",
  "contact",
  "dependent",
  "working",
  "department",
  "company",
  "designation",
  "location",
  "visitingCardUrl"           // Drive URL of family visiting card
];

/* ============================================================== SETUP  */

function setup() {
  const ss = ss_();
  ensureSheet_(ss, EMP_SHEET, EMP_HEADERS);
  ensureSheet_(ss, FAM_SHEET, FAM_HEADERS);
  // Touch the Drive folder so the permission is granted.
  DriveApp.getFolderById(DRIVE_FOLDER_ID).getName();
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const width = Math.max(headers.length, sh.getLastColumn() || headers.length);
  const current = sh.getRange(1, 1, 1, width).getValues()[0];
  const needsHeader = headers.some((h, i) => current[i] !== h);
  if (needsHeader) {
    sh.clear();
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
}

/* ============================================================== HTTP   */

function doGet(e) {
  try {
    const action = (e.parameter.action || "list").toLowerCase();
    if (action === "list") return jsonOut_(listEmployees_());
    if (action === "get")  return jsonOut_(getEmployee_(e.parameter.id));
    return jsonOut_({ error: "Unknown action" });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const action = (body.action || "").toLowerCase();
    if (action === "save")   return jsonOut_(saveEmployee_(body.employee));
    if (action === "delete") return jsonOut_(deleteEmployee_(body.id));
    return jsonOut_({ error: "Unknown action" });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  }
}

/* ============================================================== READ   */

function listEmployees_() {
  const empRows = readAll_(EMP_SHEET, EMP_HEADERS);
  const famRows = readAll_(FAM_SHEET, FAM_HEADERS);
  const famByEmp = {};
  famRows.forEach(f => {
    (famByEmp[f.employeeId] = famByEmp[f.employeeId] || []).push(stripEmpId_(f));
  });
  return empRows.map(r => Object.assign({}, r, {
    photoBase64: r.photoUrl || "",            // back-compat with UI fields
    familyMembers: (famByEmp[r.id] || []).map(m => Object.assign({}, m, {
      photoBase64: m.photoUrl || "",
      visitingCardBase64: m.visitingCardUrl || ""
    }))
  }));
}

function getEmployee_(id) {
  if (!id) return { error: "Missing id" };
  return listEmployees_().find(e => e.id === id) || null;
}

/* ============================================================== WRITE  */

function saveEmployee_(emp) {
  if (!emp || !emp.id) return { error: "Missing employee.id" };
  const now = new Date().toISOString();
  emp.updatedAt = now;
  emp.createdAt = emp.createdAt || now;

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  // 1) Passport photo → Drive
  const photoUrl = uploadIfBase64_(folder, emp.photoBase64, `${emp.id}_photo`);

  // 2) Employment visiting cards → Drive
  const employments = (emp.employments || []).map((e, i) => {
    const url = uploadIfBase64_(folder, e.visitingCardBase64,
                                `${emp.id}_emp${i + 1}_card`);
    const copy = Object.assign({}, e);
    delete copy.visitingCardBase64;
    copy.visitingCardUrl = url || e.visitingCardUrl || "";
    return copy;
  });

  // 3) Write the employee row
  const empSh = sheet_(EMP_SHEET);
  const rowIdx = findRowIndex_(empSh, emp.id);
  const empRecord = Object.assign({}, emp, {
    photoUrl: photoUrl || emp.photoUrl || "",
    employments: employments
  });
  const empRow = EMP_HEADERS.map(h => {
    if (h === "employments") return JSON.stringify(empRecord.employments);
    return empRecord[h] != null ? empRecord[h] : "";
  });
  if (rowIdx === -1) empSh.appendRow(empRow);
  else empSh.getRange(rowIdx, 1, 1, EMP_HEADERS.length).setValues([empRow]);

  // 4) Family members — replace all rows for this employee
  deleteFamilyByEmployee_(emp.id);
  const members = emp.familyMembers || [];
  if (members.length) {
    const famSh = sheet_(FAM_SHEET);
    const rows = members.map((m, i) => {
      const mPhoto = uploadIfBase64_(folder, m.photoBase64,
                                     `${emp.id}_fam${i + 1}_photo`);
      const mCard  = uploadIfBase64_(folder, m.visitingCardBase64,
                                     `${emp.id}_fam${i + 1}_card`);
      const rec = Object.assign({}, m, {
        employeeId: emp.id,
        photoUrl: mPhoto || m.photoUrl || "",
        visitingCardUrl: mCard || m.visitingCardUrl || ""
      });
      return FAM_HEADERS.map(h => rec[h] != null ? rec[h] : "");
    });
    famSh.getRange(famSh.getLastRow() + 1, 1, rows.length, FAM_HEADERS.length)
         .setValues(rows);
  }

  return { ok: true, id: emp.id, photoUrl: photoUrl };
}

function deleteEmployee_(id) {
  if (!id) return { error: "Missing id" };
  const empSh = sheet_(EMP_SHEET);
  const rowIdx = findRowIndex_(empSh, id);
  if (rowIdx !== -1) empSh.deleteRow(rowIdx);
  deleteFamilyByEmployee_(id);
  return { ok: true };
}

function deleteFamilyByEmployee_(employeeId) {
  const sh = sheet_(FAM_SHEET);
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, 2, last - 1, 1).getValues(); // column B = employeeId
  for (let i = ids.length - 1; i >= 0; i--) {
    if (ids[i][0] === employeeId) sh.deleteRow(i + 2);
  }
}

/* ============================================================== DRIVE  */

/**
 * If `value` is a base64 data URL (data:image/...;base64,...), upload it to
 * Drive and return a public view URL.  If `value` already looks like a URL,
 * return it unchanged.  Returns "" when there is nothing to upload.
 */
function uploadIfBase64_(folder, value, baseName) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;             // already a URL
  const m = String(value).match(/^data:(.+?);base64,(.*)$/);
  if (!m) return "";
  const mime = m[1];
  const data = m[2];
  const ext  = (mime.split("/")[1] || "png").split("+")[0];
  const blob = Utilities.newBlob(Utilities.base64Decode(data), mime,
                                 `${baseName}.${ext}`);
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (_) { /* shared drives may reject — ignore */ }
  return file.getUrl();
}

/* ============================================================== UTIL   */

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }
function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error("Missing sheet: " + name + ". Run setup() first.");
  return sh;
}

function readAll_(name, headers) {
  const sh = sheet_(name);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  return values.map(row => {
    const o = {};
    headers.forEach((h, i) => o[h] = row[i]);
    if (name === EMP_SHEET) {
      try { o.employments = o.employments ? JSON.parse(o.employments) : []; }
      catch (_) { o.employments = []; }
    }
    if (typeof o.dependent !== "undefined") o.dependent = !!o.dependent;
    if (typeof o.working   !== "undefined") o.working   = !!o.working;
    return o;
  });
}

function findRowIndex_(sh, id) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}

function stripEmpId_(famRow) {
  const o = Object.assign({}, famRow);
  delete o.employeeId;
  return o;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
