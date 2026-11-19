import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { expandPermissions } from '../../../shared/constants/permissions.js';

// Build plan P2: the single place that answers "which recruitment company
// does this user work for, and as what?". Every company-side ownership check
// (jobs.service getCompanyIdForUser/getOwnedJob, companies.service
// getCompanyByUserId) goes through here.
//
// Looks up CompanyMember first; falls back to Company.userId so an owner the
// P2 backfill somehow missed still gets exactly the access they had before.
//
// Returns { companyId, company, memberId, role, permissions, isOwner }.
export async function getCompanyContext(userId) {
  const member = await prisma.companyMember.findUnique({
    where: { userId },
    include: { company: true },
  });
  if (member) {
    return {
      companyId: member.companyId,
      company: member.company,
      memberId: member.id,
      role: member.role,
      // Legacy MANAGE_JOBS expands to JOB_CREATE/EDIT/DELETE, etc.
      permissions: expandPermissions(member.permissions),
      isOwner: member.role === 'OWNER',
      isActive: member.isActive,
    };
  }

  const company = await prisma.company.findUnique({ where: { userId } });
  if (!company) throw ApiError.notFound('Company profile not found');
  return {
    companyId: company.id,
    company,
    memberId: null,
    role: 'OWNER',
    permissions: [],
    isOwner: true,
    isActive: true,
  };
}

// Prisma `where` for the jobs this user may see. Direct-hiring model: every
// active member of a company (Admin, HR, Employee) sees all of the company's
// jobs — what they may DO with them is decided by their permissions.
export function jobScopeWhere(ctx) {
  return { companyId: ctx.companyId };
}

export async function canAccessJob(ctx, userId, job) {
  return job.companyId === ctx.companyId;
}

// Build plan P3: owners and MANAGE_CLIENTS recruiters see every client; other
// recruiters only the clients assigned to them.
export function clientScopeWhere(ctx) {
  if (ctx.isOwner || ctx.permissions.includes('MANAGE_CLIENTS')) return { companyId: ctx.companyId };
  return { companyId: ctx.companyId, recruiters: { some: { memberId: ctx.memberId } } };
}
