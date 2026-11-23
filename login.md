# Demo logins

Created by `npm run db:seed:demo` (`scripts/seed-hiring-demo.mjs`). All accounts are fictional and on
`.demo` domains, so no real inbox receives their emails.

- **Password for every account:** the `DEMO_PASSWORD` value used when seeding (default `Demo@123`).
  On any shared or public deployment, seed with a different, strong `DEMO_PASSWORD`.
- Overview of every role and link: **`/live-demo`** (shows the password only when `DEMO_PAGE=true`).
- Open each role in a separate browser window or incognito window so the logins don't replace each other.

| Role | Email | Lands on | What to try |
| --- | --- | --- | --- |
| Company admin — Finlytics Software (Fintech) | `admin@finlytics.demo` | `/company/dashboard` | Team → edit permissions, switch HR ↔ Employee; delete a job with no applicants |
| HR — Finlytics | `hr@finlytics.demo` | `/company/dashboard` | Create / edit jobs, review applicants — no Delete button |
| HR (review only) — Finlytics | `hr2@finlytics.demo` | `/company/dashboard` | Can review applicants but not create or edit jobs |
| Employee — Finlytics | `employee@finlytics.demo` | `/company/dashboard` | Read only — no create / edit / delete / review buttons |
| Company admin — Medivance Health (Healthcare) | `admin@medivance.demo` | `/company/dashboard` | A separate company — never sees Finlytics data |
| Company admin — GreenGrid Energy (Renewable Energy) | `admin@greengrid.demo` | `/company/dashboard` | Newest company |
| Student — Kavya Reddy (MERN) | `kavya@students.demo` | `/candidate/dashboard` | Find jobs → MERN Stack Developer shows a high fit → Check my fit → Apply |
| Student — Aditya Rao (support) | `aditya@students.demo` | `/candidate/dashboard` | Developer jobs show a low fit |

More students: `aman@`, `priya@`, `rahul@`, `sneha@`, `farhan@`, `meera@`, `nikhil@` — all `@students.demo`.

## Reset

```bash
node scripts/backup-db.mjs before-demo        # back up first — it writes to DATABASE_URL
node scripts/seed-hiring-demo.mjs --reset     # remove the demo set and recreate it
# add --yes for a non-local (dedicated demo) database — never production
```

Sign up as someone new at `/auth/register/student` or `/auth/register/company`; sample resumes are on
`/live-demo` (and in `public/sample-resumes/`).
