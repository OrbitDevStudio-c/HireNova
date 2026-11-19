-- Company-side roles: a company Admin (OWNER) creates HR and EMPLOYEE
-- members with per-person permissions. Additive; RECRUITER stays for old rows.
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'HR';
ALTER TYPE "MemberRole" ADD VALUE IF NOT EXISTS 'EMPLOYEE';
