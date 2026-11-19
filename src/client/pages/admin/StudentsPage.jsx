import { useEffect, useState } from 'react';
import { Search, GraduationCap, MapPin } from 'lucide-react';
import { adminApi } from '../../services/admin.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { inputClass } from '../../components/ui/FormField.jsx';

const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function SkillChips({ skills }) {
  if (!skills?.length) return <span className="text-xs text-slate-400">No skills listed</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 4).map((s) => (
        <span key={s} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {s}
        </span>
      ))}
      {skills.length > 4 && <span className="text-xs text-slate-400">+{skills.length - 4}</span>}
    </div>
  );
}

// Platform Admin: every student, their activity, and account control.
export default function StudentsPage() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [pending, setPending] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');

  const load = (params = filters) => {
    setError('');
    adminApi
      .listStudents(params)
      .then((data) => setStudents(data.students))
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    const t = setTimeout(() => load(filters), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setStatus = async (s, isActive) => {
    setBusyId(s.id);
    setActionError('');
    try {
      await adminApi.setUserStatus(s.userId, isActive);
      setStudents((list) => list.map((x) => (x.id === s.id ? { ...x, isActive } : x)));
      setPending(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const StatusAction = ({ s }) =>
    s.isActive ? (
      <Button variant="ghost" onClick={() => setPending(s)}>
        Deactivate
      </Button>
    ) : (
      <Button variant="secondary" loading={busyId === s.id} onClick={() => setStatus(s, true)}>
        Activate
      </Button>
    );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Students</h2>
        <p className="text-sm text-slate-500">Everyone who signed up to find jobs</p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className={`${inputClass} min-h-[44px] pl-9`}
            placeholder="Search by name, email, city or skill"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            maxLength={100}
            aria-label="Search students"
          />
        </div>
        <select
          className={`${inputClass} min-h-[44px] sm:w-44`}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}
      {error && <ErrorState message={error} onRetry={() => load()} />}
      {!error && !students && <LoadingState />}

      {students && students.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title={filters.q || filters.status ? 'No students match' : 'No students yet'}
          description={filters.q || filters.status ? 'Try a different search or status.' : 'Students appear here once they sign up.'}
        />
      )}

      {students && students.length > 0 && (
        <>
          <p className="mb-3 text-xs text-slate-500">
            {students.length} student{students.length === 1 ? '' : 's'}
          </p>

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {students.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{s.fullName}</p>
                    <p className="truncate text-sm text-slate-500">{s.email}</p>
                    {s.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {s.location}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <div className="mt-3">
                  <SkillChips skills={s.skills} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Applied', s.applicationCount],
                    ['Interviews', s.interviewCount],
                    ['Resumes', s.resumeCount],
                  ].map(([label, n]) => (
                    <div key={label} className="rounded-lg bg-slate-50 py-1.5">
                      <p className="text-sm font-semibold text-slate-900">{n}</p>
                      <p className="text-[11px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Joined {formatDate(s.createdAt)}</span>
                  <StatusAction s={s} />
                </div>
              </Card>
            ))}
          </div>

          {/* Tablet/desktop: table */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Skills</th>
                  <th className="px-5 py-3 text-right">Applied</th>
                  <th className="px-5 py-3 text-right">Interviews</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id} className="align-top hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">{s.fullName}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                      {s.location && <p className="text-xs text-slate-400">{s.location}</p>}
                    </td>
                    <td className="max-w-[260px] px-5 py-3">
                      <SkillChips skills={s.skills} />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{s.applicationCount}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{s.interviewCount}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <StatusAction s={s} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title="Deactivate this student?"
        description={pending ? `${pending.fullName} won't be able to log in. Their applications are kept.` : ''}
        confirmLabel="Deactivate"
        loading={busyId === pending?.id}
        onConfirm={() => setStatus(pending, false)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
