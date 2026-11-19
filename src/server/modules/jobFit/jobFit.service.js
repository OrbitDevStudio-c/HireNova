import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { JOB_STATUS } from '../../../shared/constants/statuses.js';
import { computeSkillOverlap, computeExperienceScore, computeEducationScore } from '../screening/deterministic.util.js';
import { computeMatch } from '../screening/screening.service.js';

// Student "how well do I fit?" checks against open jobs, using their primary
// resume. Two levels:
//   • quick fit — deterministic (skills / experience / education), no AI, cheap
//     enough to score every open job for the job board.
//   • detailed fit — the same AI screening engine companies use (computeMatch),
//     run on demand for one job. Falls back to the quick fit if the AI fails.
// Nothing here is saved or shown to companies; it's the student's own preview.

const OPEN_JOB_WHERE = { status: JOB_STATUS.OPEN, company: { status: 'ACTIVE' } };

async function loadStudent(userId) {
  const candidate = await prisma.candidate.findUnique({ where: { userId } });
  if (!candidate) throw ApiError.notFound('Student profile not found');
  const resume = await prisma.resume.findFirst({
    where: { candidateId: candidate.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  });
  return { candidate, resume };
}

// Resume skills plus the skills the student typed on their profile.
function studentSkills(candidate, resume) {
  const fromResume = Array.isArray(resume?.parsedData?.skills) ? resume.parsedData.skills : [];
  return [...new Set([...fromResume, ...(candidate.skills || [])].filter(Boolean))];
}

export function quickFit(job, { skills, years, education }) {
  const all = computeSkillOverlap(skills, [...job.requiredSkills, ...job.preferredSkills]);
  const required = computeSkillOverlap(skills, job.requiredSkills);
  const experience = computeExperienceScore(years, job.minimumExperience, job.maximumExperience);
  const edu = computeEducationScore(education, job.educationRequirements);
  return {
    score: Math.round(all.score * 0.5 + experience.score * 0.3 + edu.score * 0.2),
    skillMatchScore: all.score,
    experienceMatchScore: experience.score,
    educationMatchScore: edu.score,
    matchedSkills: all.matched,
    missingSkills: required.missing,
  };
}

function profileFor(candidate, resume) {
  const data = resume?.parsedData || {};
  return {
    skills: studentSkills(candidate, resume),
    years: data.totalExperienceYears,
    education: Array.isArray(data.education) ? data.education : [],
  };
}

const FIT_JOB_SELECT = {
  id: true,
  requiredSkills: true,
  preferredSkills: true,
  minimumExperience: true,
  maximumExperience: true,
  educationRequirements: true,
};

// { hasResume, resume, fits: { [jobId]: quickFit } } for every open job.
export async function listFits(userId) {
  const { candidate, resume } = await loadStudent(userId);
  const profile = profileFor(candidate, resume);
  if (!resume && profile.skills.length === 0) return { hasResume: false, resume: null, fits: {} };

  const jobs = await prisma.job.findMany({ where: OPEN_JOB_WHERE, select: FIT_JOB_SELECT, take: 500 });
  const fits = Object.fromEntries(jobs.map((job) => [job.id, quickFit(job, profile)]));
  return {
    hasResume: Boolean(resume),
    resume: resume ? { id: resume.id, fileName: resume.fileName } : null,
    fits,
  };
}

// AI-backed fit for one job, with strengths / gaps the student can act on.
export async function detailedFit(userId, jobId) {
  const { candidate, resume } = await loadStudent(userId);
  if (!resume) throw ApiError.badRequest('Upload your resume first to check your fit', 'RESUME_REQUIRED');

  const job = await prisma.job.findFirst({ where: { id: jobId, ...OPEN_JOB_WHERE } });
  if (!job) throw ApiError.notFound('Job not found');

  try {
    const m = await computeMatch(job, resume);
    return {
      source: 'ai',
      score: m.overallScore,
      skillMatchScore: m.skillMatchScore,
      experienceMatchScore: m.experienceMatchScore,
      educationMatchScore: m.educationMatchScore,
      matchedSkills: m.matchedSkills,
      missingSkills: m.missingSkills,
      strengths: m.ai?.strengths || [],
      concerns: m.ai?.concerns || [],
      summary: m.ai?.reasoning || null,
    };
  } catch (err) {
    console.error('[jobFit] AI fit failed, using quick fit:', err.message);
    return { source: 'quick', ...quickFit(job, profileFor(candidate, resume)), strengths: [], concerns: [], summary: null };
  }
}
