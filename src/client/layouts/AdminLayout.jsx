import { LayoutDashboard, Building2, GraduationCap, Users } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';

// Platform Admin area: platform analytics, companies, students, all logins.
const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  return <DashboardLayout navItems={navItems} />;
}
