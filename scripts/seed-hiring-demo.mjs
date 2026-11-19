// Demo dataset for the direct-hiring model, written straight through Prisma
// (no running API, no AI key needed):
//   - Platform Admin (admin@platform.demo)
//   - 3 companies (Fintech / Healthcare / Renewable Energy), each with an
//     Admin, plus HR and Employee members with different permissions
//   - 7 open jobs spread over the last ~6 months (dashboard trends)
//   - 9 students with real .docx resumes (stored via the app's storage
//     driver) and applications scored with the same deterministic fit the
//     student job board uses
//
//   node scripts/seed-hiring-demo.mjs           → create (skips if it exists)
//   node scripts/seed-hiring-demo.mjs --reset   → remove the demo set, recreate
//   add --yes to allow a non-local DATABASE_URL (dedicated demo DB only)
//
// Every account is on a .demo domain, so --reset removes exactly this set.
// Password for every account: DEMO_PASSWORD (default Demo@123).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/server/config/prisma.js';
import { storage } from '../src/server/resume/storage/index.js';
import { quickFit } from '../src/server/modules/jobFit/jobFit.service.js';
import { ROLE_PRESETS } from '../src/shared/constants/permissions.js';
import { DEMO_EMAIL_DOMAINS } from '../src/shared/constants/demo.js';
import { buildDocx, DOCX_MIME } from './lib/testDocx.mjs';
import { COMPANIES, STUDENTS } from './lib/hiringDemoData.mjs';

const PASSWORD = (process.env.DEMO_PASSWORD || 'Demo@123').trim();
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const log = (t) => console.log(t);

function guardDatabase() {
  const url = process.env.DATABASE_URL || '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    /* unparsable — treated as non-local */
  }
  const local = ['localhost', '127.0.0.1', '::1'].includes(host);
  log(`Target database host: ${host || '(unknown)'}${local ? ' (local)' : ''}`);
  if (!local && !process.argv.includes('--yes')) {
    console.error('Refusing to seed a non-local database. Re-run with --yes only for a dedicated demo database (never production).');
    process.exit(1);
  }
}

const demoEmailWhere = { OR: DEMO_EMAIL_DOMAINS.map((d) => ({ email: { endsWith: `@${d}` } })) };

async function reset() {
  const users = await prisma.user.findMany({ where: demoEmailWhere, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const resumes = await prisma.resume.findMany({ where: { candidate: { userId: { in: userIds } } }, select: { storageKey: true } });
  // Company delete cascades jobs → applications → screening/interviews.
  const companies = await prisma.company.deleteMany({ where: { userId: { in: userIds } } });
  const deleted = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.resumeBlob.deleteMany({ where: { id: { in: resumes.map((r) => r.storageKey) } } }).catch(() => {});
  log(`Removed ${deleted.count} demo users and ${companies.count} companies.`);
}

function resumeLines(s) {
  return [
    s.fullName,
    `${s.email} · ${s.location}`,
    s.headline,
    '',
    'SKILLS',
    s.skills.join(', '),
    '',
    'EXPERIENCE',
    s.years ? `${s.years} years of professional experience` : 'Fresher — projects and internships',
    '',
    'EDUCATION',
    ...s.education.map((e) => `${e.degree} in ${e.field}, ${e.institution}`),
  ];
}

async function createAdmin(passwordHash) {
  await prisma.user.create({ data: { email: 'admin@platform.demo', passwordHash, role: 'ADMIN' } });
  log('  admin@platform.demo  (Platform admin)');
}

async function createCompany(c, passwordHash) {
  const created = daysAgo(c.daysAgo);
  const owner = await prisma.user.create({
    data: {
      email: c.admin.email,
      passwordHash,
      role: 'COMPANY',
      createdAt: created,
      company: {
        create: {
          name: c.name,
          industry: c.industry,
          location: c.location,
          website: c.website,
          description: c.description,
          size: c.size,
          createdAt: created,
        },
      },
    },
    include: { company: true },
  });
  const companyId = owner.company.id;
  await prisma.companyMember.create({ data: { companyId, userId: owner.id, role: 'OWNER', fullName: c.admin.fullName } });
  log(`  ${c.admin.email}  (Admin, ${c.name})`);

  for (const m of c.members) {
    const user = await prisma.user.create({ data: { email: m.email, passwordHash, role: 'RECRUITER', createdAt: created } });
    await prisma.companyMember.create({
      data: { companyId, userId: user.id, role: m.role, fullName: m.fullName, permissions: m.permissions || ROLE_PRESETS[m.role] },
    });
    log(`  ${m.email}  (${m.role}, ${c.name})`);
  }

  const jobs = [];
  for (const j of c.jobs) {
    const { daysAgo: d, ...fields } = j;
    jobs.push(
      await prisma.job.create({
        data: { ...fields, companyId, createdBy: owner.id, status: 'OPEN', createdAt: daysAgo(d) },
      })
    );
  }
  return jobs;
}

async function createStudent(s, passwordHash, jobsByTitle) {
  const user = await prisma.user.create({
    data: {
      email: s.email,
      passwordHash,
      role: 'CANDIDATE',
      createdAt: daysAgo(s.daysAgo),
      candidate: {
        create: {
          fullName: s.fullName,
          location: s.location,
          headline: s.headline,
          skills: s.skills,
          createdAt: daysAgo(s.daysAgo),
        },
      },
    },
    include: { candidate: true },
  });

  const lines = resumeLines(s);
  const buffer = Buffer.from(buildDocx(lines));
  const { storageKey, storageUrl } = await storage.save(buffer, { mimeType: DOCX_MIME });
  const resume = await prisma.resume.create({
    data: {
      candidateId: user.candidate.id,
      fileName: `${s.fullName.replace(/\s+/g, '_')}_Resume.docx`,
      fileType: DOCX_MIME,
      fileSize: buffer.length,
      storageKey,
      storageUrl,
      rawText: lines.join('\n'),
      parsedData: {
        fullName: s.fullName,
        email: s.email,
        skills: s.skills,
        totalExperienceYears: s.years,
        education: s.education,
      },
      isPrimary: true,
    },
  });

  const profile = { skills: s.skills, years: s.years, education: s.education };
  const results = [];
  for (const title of s.applyTo) {
    const job = jobsByTitle[title];
    if (!job) continue;
    const fit = quickFit(job, profile);
    const status = fit.score >= 75 ? 'SHORTLISTED' : fit.score < 50 ? 'REJECTED' : 'APPLIED';
    // Applied a little after both the job and the student existed.
    const appliedAt = new Date(Math.max(job.createdAt.getTime(), user.createdAt.getTime()) + DAY / 2);
    await prisma.application.create({
      data: {
        candidateId: user.candidate.id,
        jobId: job.id,
        resumeId: resume.id,
        status,
        createdAt: appliedAt > new Date() ? new Date() : appliedAt,
        screeningResult: {
          create: {
            status: 'COMPLETED',
            overallScore: fit.score,
            skillMatchScore: fit.skillMatchScore,
            experienceMatchScore: fit.experienceMatchScore,
            educationMatchScore: fit.educationMatchScore,
            matchedSkills: fit.matchedSkills,
            missingSkills: fit.missingSkills,
            reasoning: 'Demo data — scored with the deterministic resume fit (no AI call).',
            aiModel: 'demo-deterministic',
            screenedAt: appliedAt > new Date() ? new Date() : appliedAt,
          },
        },
      },
    });
    results.push(`${title} ${fit.score}% → ${status}`);
  }
  log(`  ${s.email}  (Student)  ${results.join(' · ') || 'no applications'}`);
}

async function main() {
  guardDatabase();
  if (process.argv.includes('--reset')) await reset();
  else if (await prisma.user.findUnique({ where: { email: 'admin@platform.demo' } })) {
    log('Demo data already exists. Run with --reset to recreate it.');
    return;
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  log('\n▸ Platform admin');
  await createAdmin(passwordHash);

  log('\n▸ Companies, teams and jobs');
  const jobsByTitle = {};
  for (const c of COMPANIES) {
    for (const job of await createCompany(c, passwordHash)) jobsByTitle[job.title] = job;
  }

  log('\n▸ Students, resumes and applications');
  for (const s of STUDENTS) await createStudent(s, passwordHash, jobsByTitle);

  log(`\nDone. Every demo account uses the password from DEMO_PASSWORD (default Demo@123).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
