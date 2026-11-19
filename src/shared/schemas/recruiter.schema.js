import { z } from 'zod';
import { emailSchema, personNameSchema, idSchema } from './common.js';
import { ASSIGNABLE_PERMISSIONS } from '../constants/permissions.js';

// Build plan P2 — recruiter management requests.

const permissionsSchema = z
  .array(z.enum(ASSIGNABLE_PERMISSIONS, { errorMap: () => ({ message: 'Unknown permission' }) }))
  .max(ASSIGNABLE_PERMISSIONS.length)
  .transform((list) => [...new Set(list)]);
const idListSchema = z
  .array(idSchema())
  .max(500, 'Too many items selected')
  .transform((list) => [...new Set(list)]);

// Company-side staff role chosen by the Admin.
const memberRoleSchema = z.enum(['HR', 'EMPLOYEE'], { errorMap: () => ({ message: 'Choose HR or Employee' }) });

export const inviteRecruiterSchema = z.object({
  email: emailSchema,
  fullName: personNameSchema('Name'),
  memberRole: memberRoleSchema.default('EMPLOYEE'),
  permissions: permissionsSchema.default([]),
  jobIds: idListSchema.default([]),
});

export const updateRecruiterSchema = z.object({
  fullName: personNameSchema('Name'),
  memberRole: memberRoleSchema.optional(),
});

export const recruiterStatusSchema = z.object({
  isActive: z.boolean(),
});

export const recruiterPermissionsSchema = z.object({
  permissions: permissionsSchema,
});

export const recruiterJobsSchema = z.object({
  jobIds: idListSchema,
});

export const jobRecruitersSchema = z.object({
  memberIds: idListSchema,
});
