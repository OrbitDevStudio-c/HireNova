// Where each role lands after login/registration.
export function homePathForRole(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  // Company Admin (COMPANY) and HR / Employees (RECRUITER) share the company area.
  if (role === 'COMPANY' || role === 'RECRUITER') return '/company/dashboard';
  if (role === 'CLIENT_HR') return '/client/candidates';
  return '/candidate/dashboard';
}
