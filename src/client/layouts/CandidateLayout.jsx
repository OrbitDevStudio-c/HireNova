import { LayoutDashboard, Search, FileText, User } from 'lucide-react';
import DashboardLayout from './DashboardLayout.jsx';

// Student area: browse every company's jobs with a resume-fit score, apply,
// track applications and interviews.
const navItems = [
  { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/candidate/jobs', label: 'Find jobs', icon: Search },
  { to: '/candidate/applications', label: 'Applications', icon: FileText },
  { to: '/candidate/profile', label: 'Profile & resume', icon: User },
];

export default function CandidateLayout() {
  return <DashboardLayout navItems={navItems} />;
}
