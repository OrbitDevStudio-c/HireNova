import { useAuth } from './useAuth.jsx';
import { expandPermissions, MEMBER_ROLE_LABELS } from '../../shared/constants/permissions.js';

// What the logged-in company-side user may do. The company Admin (user role
// COMPANY) can do everything; HR / Employees (user role RECRUITER) only what
// their membership grants. Only hides UI — the server enforces the same rules.
export function usePermissions() {
  const { user } = useAuth();
  const isOwner = user?.role === 'COMPANY';
  const isRecruiter = user?.role === 'RECRUITER';
  const granted = expandPermissions(user?.membership?.permissions || []);

  const can = (permission) => isOwner || (isRecruiter && granted.includes(permission));
  const roleLabel = isOwner ? 'Admin' : MEMBER_ROLE_LABELS[user?.membership?.role] || 'Team member';

  return { can, isOwner, isRecruiter, roleLabel };
}
