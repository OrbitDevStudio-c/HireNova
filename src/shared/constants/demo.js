// Demo page (/live-demo) + the demo dataset (scripts/seed-hiring-demo.mjs,
// also run by scripts/seed-demo.mjs). Direct-hiring model: Platform Admin,
// companies with Admin / HR / Employee, and students. Fixed accounts on
// non-routable .demo domains, so no real inbox ever receives their emails.
// /live-demo reads the password from DEMO_PASSWORD on the server (shown only
// while DEMO_PAGE is on); the home page shows HOME_DEMO_PASSWORD below.

export const DEMO_EMAIL_DOMAINS = ['platform.demo', 'finlytics.demo', 'medivance.demo', 'greengrid.demo', 'students.demo'];
export const DEMO_COMPANY_NAME = 'Finlytics Software';

// Shown on the public home page (requested): the seeded demo accounts and
// their shared password. Only meaningful where scripts/seed-hiring-demo.mjs
// was run with the default DEMO_PASSWORD — never real accounts.
export const HOME_DEMO_PASSWORD = 'Demo@1234';
export const HOME_DEMO_KEYS = ['admin', 'companyAdmin', 'hr', 'employee', 'student'];

// Sample resumes served from /public/sample-resumes (fictional people).
export const DEMO_SAMPLE_RESUMES = [
  {
    file: 'Kavya_Reddy_FullStack_Resume.docx',
    title: 'Strong full-stack resume',
    description: 'Upload it as a new student — developer jobs show a high fit',
  },
  {
    file: 'Aditya_Rao_Resume.docx',
    title: 'Non-technical resume',
    description: 'Customer-support profile — most developer jobs show a low fit',
  },
];

export const DEMO_ACCOUNTS = [
  {
    key: 'admin',
    role: 'ADMIN',
    label: 'Platform admin',
    email: 'admin@platform.demo',
    canDo: ['Platform dashboard: growth, booming fields, in-demand skills', 'Suspend or reactivate companies', 'Activate / deactivate students'],
  },
  {
    key: 'companyAdmin',
    role: 'COMPANY',
    label: 'Company admin',
    email: 'admin@finlytics.demo',
    fullName: 'Neha Kapoor',
    canDo: ['Everything inside Finlytics Software', 'Add HR and employees, tick their permissions', 'Post, edit, close and delete jobs'],
  },
  {
    key: 'hr',
    role: 'RECRUITER',
    memberRole: 'HR',
    label: 'Company HR',
    email: 'hr@finlytics.demo',
    fullName: 'Rohan Mehta',
    canDo: ['Create and edit jobs (no delete)', 'Review applicants, run AI screening', 'Configure AI interviews'],
  },
  {
    key: 'employee',
    role: 'RECRUITER',
    memberRole: 'EMPLOYEE',
    label: 'Company employee',
    email: 'employee@finlytics.demo',
    fullName: 'Sana Iyer',
    canDo: ['Read only: jobs and applicants', 'No create / edit / delete buttons'],
  },
  {
    key: 'student',
    role: 'CANDIDATE',
    label: 'Student',
    email: 'kavya@students.demo',
    fullName: 'Kavya Reddy',
    canDo: ['Browse every company’s jobs with a fit score', 'Check fit with AI, apply, track applications', 'Take the AI interview once shortlisted'],
  },
  {
    key: 'companyB',
    role: 'COMPANY',
    label: 'Second company admin',
    email: 'admin@medivance.demo',
    fullName: 'Arjun Nair',
    canDo: ['A separate company with its own jobs and team', 'Never sees Finlytics data'],
  },
];
