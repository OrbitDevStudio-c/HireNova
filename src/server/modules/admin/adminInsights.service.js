import { prisma } from '../../config/prisma.js';
import { ROLES } from '../../../shared/constants/roles.js';

// Platform Admin dashboard + student management. Aggregation is done in JS
// over narrow selects — fine at platform scale and keeps it portable.

const DAY = 24 * 60 * 60 * 1000;
const TREND_MONTHS = 6;

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function emptyTrend(now) {
  const months = [];
  for (let i = TREND_MONTHS - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    months.push({
      month: monthKey(d),
      label: d.toLocaleString('en', { month: 'short', timeZone: 'UTC' }),
      companies: 0,
      students: 0,
      jobs: 0,
      applications: 0,
    });
  }
  return months;
}

function bump(trend, rows, field) {
  const byKey = Object.fromEntries(trend.map((m) => [m.month, m]));
  for (const { createdAt } of rows) {
    const m = byKey[monthKey(createdAt)];
    if (m) m[field] += 1;
  }
}

// Case-insensitive tally that keeps the most common spelling.
function topCounts(lists, limit) {
  const tally = new Map();
  for (const list of lists) {
    for (const raw of new Set((list || []).map((s) => s?.trim()).filter(Boolean))) {
      const key = raw.toLowerCase();
      const entry = tally.get(key) || { name: raw, count: 0 };
      entry.count += 1;
      tally.set(key, entry);
    }
  }
  return [...tally.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function getStats() {
  const now = new Date();
  const trendStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (TREND_MONTHS - 1), 1));
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d60 = new Date(now.getTime() - 60 * DAY);

  const [
    companies,
    activeCompanies,
    students,
    jobs,
    openJobs,
    applications,
    interviewsCompleted,
    teamMembers,
    trendCompanies,
    trendStudents,
    trendJobs,
    trendApplications,
    recentJobs,
    openJobSkills,
    studentSkillRows,
    topJobs,
    recentCompanies,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: 'ACTIVE' } }),
    prisma.candidate.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'OPEN' } }),
    prisma.application.count(),
    prisma.interview.count({ where: { status: 'COMPLETED' } }),
    prisma.companyMember.count({ where: { role: { not: 'OWNER' } } }),
    prisma.company.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.candidate.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.job.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    prisma.application.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    // Jobs from the last 60 days, for "booming fields" growth.
    prisma.job.findMany({
      where: { createdAt: { gte: d60 } },
      select: { createdAt: true, company: { select: { industry: true } }, _count: { select: { applications: true } } },
    }),
    prisma.job.findMany({ where: { status: 'OPEN' }, select: { requiredSkills: true }, take: 3000 }),
    prisma.candidate.findMany({ select: { skills: true }, orderBy: { createdAt: 'desc' }, take: 5000 }),
    prisma.job.findMany({
      orderBy: { applications: { _count: 'desc' } },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        company: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, industry: true, status: true, createdAt: true, _count: { select: { jobs: true } } },
    }),
  ]);

  const trend = emptyTrend(now);
  bump(trend, trendCompanies, 'companies');
  bump(trend, trendStudents, 'students');
  bump(trend, trendJobs, 'jobs');
  bump(trend, trendApplications, 'applications');

  const since = (rows, from) => rows.filter((r) => r.createdAt >= from).length;

  // Booming fields: industries ranked by jobs posted in the last 30 days,
  // with growth vs the 30 days before.
  const fields = new Map();
  for (const job of recentJobs) {
    const name = job.company?.industry?.trim() || 'Other';
    const key = name.toLowerCase();
    const f = fields.get(key) || { field: name, jobsLast30: 0, jobsPrev30: 0, applications: 0 };
    if (job.createdAt >= d30) {
      f.jobsLast30 += 1;
      f.applications += job._count.applications;
    } else {
      f.jobsPrev30 += 1;
    }
    fields.set(key, f);
  }
  const booming = [...fields.values()]
    .map((f) => ({
      ...f,
      // null = new this month (nothing to compare against).
      growth: f.jobsPrev30 ? Math.round(((f.jobsLast30 - f.jobsPrev30) / f.jobsPrev30) * 100) : null,
    }))
    .filter((f) => f.jobsLast30 > 0)
    .sort((a, b) => b.jobsLast30 - a.jobsLast30 || b.applications - a.applications)
    .slice(0, 8);

  return {
    totals: {
      companies,
      activeCompanies,
      suspendedCompanies: companies - activeCompanies,
      students,
      jobs,
      openJobs,
      applications,
      interviewsCompleted,
      teamMembers,
    },
    last30: {
      companies: since(trendCompanies, d30),
      students: since(trendStudents, d30),
      jobs: since(trendJobs, d30),
      applications: since(trendApplications, d30),
    },
    trend,
    booming,
    // Demand (skills open jobs ask for) vs supply (skills students list).
    inDemandSkills: topCounts(openJobSkills.map((j) => j.requiredSkills), 10).map((s) => ({ skill: s.name, jobs: s.count })),
    studentSkills: topCounts(studentSkillRows.map((c) => c.skills), 10).map((s) => ({ skill: s.name, students: s.count })),
    topJobs: topJobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      company: j.company,
      applications: j._count.applications,
    })),
    recentCompanies: recentCompanies.map(({ _count, ...c }) => ({ ...c, jobCount: _count.jobs })),
  };
}

// ─── Students ───

export async function listStudents({ q, status } = {}) {
  const search = q?.trim();
  const rows = await prisma.candidate.findMany({
    where: {
      user: {
        role: ROLES.CANDIDATE,
        ...(status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {}),
      },
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { location: { contains: search, mode: 'insensitive' } },
              { skills: { has: search } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      location: true,
      headline: true,
      skills: true,
      createdAt: true,
      user: { select: { id: true, email: true, isActive: true } },
      _count: { select: { applications: true, resumes: true } },
      applications: { where: { interviews: { some: {} } }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return rows.map(({ user, _count, applications, ...s }) => ({
    ...s,
    userId: user.id,
    email: user.email,
    isActive: user.isActive,
    applicationCount: _count.applications,
    resumeCount: _count.resumes,
    interviewCount: applications.length,
  }));
}
