// What a company member (HR / Employee) may do inside their company. The
// company Admin (owner, user role COMPANY) implicitly has every permission.
// Stored as plain strings in CompanyMember.permissions, so keys can be added
// later without a migration.
export const PERMISSIONS = {
  // Read-only: applicants, their CV (view / download), scores, interview results.
  VIEW_CANDIDATES: 'VIEW_CANDIDATES',
  // Granular job permissions.
  JOB_CREATE: 'JOB_CREATE',
  JOB_EDIT: 'JOB_EDIT',
  JOB_DELETE: 'JOB_DELETE',
  REVIEW_CANDIDATES: 'REVIEW_CANDIDATES',
  CONFIGURE_INTERVIEWS: 'CONFIGURE_INTERVIEWS',
  // Create HR / employees and set their permissions. (Key kept from the
  // agency era so existing rows keep working.)
  MANAGE_RECRUITERS: 'MANAGE_RECRUITERS',

  // ── Legacy keys (agency era). Not offered in the UI any more. ──
  // MANAGE_JOBS = JOB_CREATE + JOB_EDIT + JOB_DELETE (see expandPermissions).
  MANAGE_JOBS: 'MANAGE_JOBS',
  MANAGE_CLIENTS: 'MANAGE_CLIENTS',
  SUBMIT_CANDIDATES: 'SUBMIT_CANDIDATES',
};

// Shown in the create / edit-permissions UI, in this order.
export const PERMISSION_OPTIONS = [
  { key: PERMISSIONS.VIEW_CANDIDATES, label: 'View candidates', description: 'See applicants, CVs, fit scores and interview results (read only)' },
  { key: PERMISSIONS.JOB_CREATE, label: 'Create jobs', description: 'Post new jobs' },
  { key: PERMISSIONS.JOB_EDIT, label: 'Edit jobs', description: 'Change job details and settings' },
  { key: PERMISSIONS.JOB_DELETE, label: 'Close / delete jobs', description: 'Close a job, or delete one that has no applicants' },
  { key: PERMISSIONS.REVIEW_CANDIDATES, label: 'Review candidates', description: 'Run AI screening, shortlist / reject applicants' },
  { key: PERMISSIONS.CONFIGURE_INTERVIEWS, label: 'Configure interviews', description: 'AI interviewer settings, interview slots and links' },
  { key: PERMISSIONS.MANAGE_RECRUITERS, label: 'Manage team', description: 'Add HR / employees and set their permissions' },
];

// Every key the API accepts (UI keys + legacy keys still stored on old rows).
export const ASSIGNABLE_PERMISSIONS = Object.values(PERMISSIONS);
export const UI_PERMISSION_KEYS = PERMISSION_OPTIONS.map((p) => p.key);

// Company member roles (CompanyMember.role). RECRUITER is legacy = HR.
export const MEMBER_ROLES = { OWNER: 'OWNER', HR: 'HR', EMPLOYEE: 'EMPLOYEE', RECRUITER: 'RECRUITER' };
export const STAFF_MEMBER_ROLES = [MEMBER_ROLES.HR, MEMBER_ROLES.EMPLOYEE, MEMBER_ROLES.RECRUITER];

export const MEMBER_ROLE_LABELS = { OWNER: 'Admin', HR: 'HR', EMPLOYEE: 'Employee', RECRUITER: 'HR' };

// Starting permissions when the Admin creates someone; they can tick/untick
// any box afterwards.
export const ROLE_PRESETS = {
  HR: [
    PERMISSIONS.VIEW_CANDIDATES,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_EDIT,
    PERMISSIONS.REVIEW_CANDIDATES,
    PERMISSIONS.CONFIGURE_INTERVIEWS,
  ],
  // Employees are read-only by default.
  EMPLOYEE: [PERMISSIONS.VIEW_CANDIDATES],
};

export const DEFAULT_RECRUITER_PERMISSIONS = ROLE_PRESETS.EMPLOYEE;

// Any of these lets a member READ applicants / CVs / scores / interview results.
export const VIEW_CANDIDATE_PERMISSIONS = [PERMISSIONS.VIEW_CANDIDATES, PERMISSIONS.REVIEW_CANDIDATES];

const JOB_KEYS = [PERMISSIONS.JOB_CREATE, PERMISSIONS.JOB_EDIT, PERMISSIONS.JOB_DELETE];

// Stored list → effective list. Legacy MANAGE_JOBS grants all three job
// permissions; JOB_EDIT satisfies older checks that still ask for MANAGE_JOBS
// (job-level interview/link settings).
export function expandPermissions(list = []) {
  const set = new Set(list);
  if (set.has(PERMISSIONS.MANAGE_JOBS)) JOB_KEYS.forEach((k) => set.add(k));
  if (set.has(PERMISSIONS.JOB_EDIT)) set.add(PERMISSIONS.MANAGE_JOBS);
  return [...set];
}

// What the team UI shows / edits: effective permissions limited to UI keys.
export function uiPermissions(list = []) {
  const effective = new Set(expandPermissions(list));
  return UI_PERMISSION_KEYS.filter((k) => effective.has(k));
}
