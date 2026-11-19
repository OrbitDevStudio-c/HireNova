import { LayoutDashboard, Briefcase, Users } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';
import { usePermissions } from '../hooks/usePermissions.js';

// Company area — shared by the company Admin, HR and Employees. Items are
// hidden when the member lacks the permission (the server enforces it too).
const navItems = [
  { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/company/team', label: 'Team', icon: Users, permission: 'MANAGE_RECRUITERS' },
];

export default function CompanyLayout() {
  const { can } = usePermissions();
  return <DashboardLayout navItems={navItems.filter((item) => !item.permission || can(item.permission))} />;
}
