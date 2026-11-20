import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, GraduationCap, Briefcase, FileText, Video, TrendingUp, Flame, Users } from 'lucide-react';
import { adminApi } from '../../services/admin.js';
import Card from '../../components/ui/Card.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';

// Platform Admin dashboard: growth, activity, and which fields / skills are
// booming. Every chart is a single measure in one hue (brand), so no series
// legend is needed; values show on hover/focus and in the "Show as table" view.

function StatTile({ icon: Icon, label, value, sub, tone }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`shrink-0 rounded-lg p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-tight text-slate-900">{value.toLocaleString()}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </Card>
  );
}

// One small vertical-bar chart per metric (small multiples, not a dual axis).
function TrendChart({ title, data, field }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...data.map((d) => d[field]));
  const shown = active ?? data.length - 1;
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-500">
          <span className="font-semibold text-slate-900">{data[shown][field]}</span> in {data[shown].label}
        </p>
      </div>
      <div className="flex h-28 items-end gap-1.5 border-b border-slate-200" onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <button
            key={d.month}
            type="button"
            className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            aria-label={`${d.label}: ${d[field]}`}
          >
            <span
              className={`block w-full rounded-t ${i === shown ? 'bg-brand-600' : 'bg-brand-300 group-hover:bg-brand-500'}`}
              style={{ height: `${Math.max(d[field] ? 4 : 0, (d[field] / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">
        {data.map((d) => (
          <span key={d.month} className="min-w-0 flex-1 truncate text-center text-[11px] text-slate-500">
            {d.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

// Horizontal magnitude bars with the value as a direct label.
function BarList({ rows, valueLabel, empty }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name} title={`${r.name}: ${r.value} ${valueLabel}`}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{r.name}</span>
            <span className="shrink-0 tabular-nums text-slate-500">{r.value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Growth({ value }) {
  if (value == null) return <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">New</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium tabular-nums ${up ? 'text-emerald-700' : 'text-slate-500'}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [trendTable, setTrendTable] = useState(false);

  const load = () => {
    setError('');
    adminApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return <LoadingState label="Loading platform stats…" />;

  const { totals, last30, trend, booming, inDemandSkills, studentSkills, topJobs, recentCompanies } = stats;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Platform dashboard</h2>
        <p className="text-sm text-slate-500">Companies, students and hiring activity across HireNova</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={Building2} label="Companies" value={totals.companies} sub={`+${last30.companies} in 30 days`} tone="bg-violet-50 text-violet-600" />
        <StatTile icon={GraduationCap} label="Students" value={totals.students} sub={`+${last30.students} in 30 days`} tone="bg-brand-50 text-brand-600" />
        <StatTile icon={Briefcase} label="Jobs posted" value={totals.jobs} sub={`${totals.openJobs} open now`} tone="bg-amber-50 text-amber-600" />
        <StatTile icon={FileText} label="Applications" value={totals.applications} sub={`+${last30.applications} in 30 days`} tone="bg-emerald-50 text-emerald-600" />
        <StatTile icon={Video} label="Interviews done" value={totals.interviewsCompleted} tone="bg-sky-50 text-sky-600" />
        <StatTile icon={Users} label="HR & employees" value={totals.teamMembers} sub={`${totals.suspendedCompanies} companies suspended`} tone="bg-slate-100 text-slate-600" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <TrendingUp className="h-4 w-4 text-slate-400" /> Last 6 months
        </h3>
        <button type="button" onClick={() => setTrendTable((v) => !v)} className="min-h-[44px] px-2 text-sm font-medium text-brand-600">
          {trendTable ? 'Show as charts' : 'Show as table'}
        </button>
      </div>
      {trendTable ? (
        <Card className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Month</th>
                <th className="px-4 py-2 text-right">Companies</th>
                <th className="px-4 py-2 text-right">Students</th>
                <th className="px-4 py-2 text-right">Jobs</th>
                <th className="px-4 py-2 text-right">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {trend.map((m) => (
                <tr key={m.month}>
                  <td className="px-4 py-2 text-slate-700">{m.label}</td>
                  <td className="px-4 py-2 text-right">{m.companies}</td>
                  <td className="px-4 py-2 text-right">{m.students}</td>
                  <td className="px-4 py-2 text-right">{m.jobs}</td>
                  <td className="px-4 py-2 text-right">{m.applications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TrendChart title="Companies joined" data={trend} field="companies" />
          <TrendChart title="Students signed up" data={trend} field="students" />
          <TrendChart title="Jobs posted" data={trend} field="jobs" />
          <TrendChart title="Applications" data={trend} field="applications" />
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Booming fields */}
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-1 flex items-center gap-2 font-semibold text-slate-900">
            <Flame className="h-4 w-4 text-orange-500" /> Booming fields
          </h3>
          <p className="mb-4 text-xs text-slate-500">Industries by jobs posted in the last 30 days, vs the 30 days before</p>
          {booming.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No jobs posted in the last 30 days</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {booming.map((f, i) => (
                <li key={f.field} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{f.field}</p>
                    <p className="text-xs text-slate-500">
                      {f.jobsLast30} job{f.jobsLast30 === 1 ? '' : 's'} · {f.applications} applications
                    </p>
                  </div>
                  <Growth value={f.growth} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 font-semibold text-slate-900">Most in-demand skills</h3>
          <p className="mb-4 text-xs text-slate-500">Required by open jobs</p>
          <BarList rows={inDemandSkills.map((s) => ({ name: s.skill, value: s.jobs }))} valueLabel="open jobs" empty="No open jobs yet" />
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 font-semibold text-slate-900">Top student skills</h3>
          <p className="mb-4 text-xs text-slate-500">Listed on student profiles</p>
          <BarList rows={studentSkills.map((s) => ({ name: s.skill, value: s.students }))} valueLabel="students" empty="No student skills yet" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-900">Most applied jobs</h3>
          {topJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No jobs yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{j.title}</p>
                    <Link to={`/admin/companies/${j.company.id}`} className="truncate text-xs text-brand-600 hover:underline">
                      {j.company.name}
                    </Link>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-slate-600">{j.applications} applicants</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Newest companies</h3>
            <Link to="/admin/companies" className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-600">
              View all
            </Link>
          </div>
          {recentCompanies.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No companies yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentCompanies.map((c) => (
                <li key={c.id}>
                  <Link to={`/admin/companies/${c.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.industry || 'No industry'} · {c.jobCount} jobs · joined {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
