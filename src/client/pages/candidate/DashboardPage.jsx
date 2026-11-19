import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, CalendarClock, User, Sparkles, Upload } from 'lucide-react';
import { jobsApi } from '../../services/jobs.js';
import FitBadge from '../../components/ui/FitBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import { applicationsApi } from '../../services/applications.js';
import { candidateProfileApi } from '../../services/profile.js';
import { useAuth } from '../../hooks/useAuth.jsx';
import Card from '../../components/ui/Card.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';

/** Calculate profile completeness 0–100 based on which key fields are filled. */
function calcCompleteness(candidate) {
  const checks = [
    !!candidate?.fullName,
    !!candidate?.phone,
    !!candidate?.location,
    !!candidate?.headline,
    (candidate?.skills?.length ?? 0) > 0,
    (candidate?.educations?.length ?? 0) > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function CompletenessBar({ pct }) {
  const color =
    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <Card className="mb-8 p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Profile completeness</span>
        </div>
        <span className="text-sm font-semibold text-slate-900">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct < 100 && (
        <p className="mt-2 text-xs text-slate-400">
          {pct < 50
            ? 'Complete your profile to get better job matches.'
            : pct < 80
            ? 'Almost there — add more info to stand out to recruiters.'
            : 'Looking great! A complete profile boosts your visibility.'}
        </p>
      )}
    </Card>
  );
}

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [matches, setMatches] = useState({ hasResume: true, jobs: [] });
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([applicationsApi.listMine(), candidateProfileApi.get()])
      .then(([appData, profileData]) => {
        setApplications(appData.applications);
        setCandidate(profileData.candidate);
      })
      .catch((err) => setError(err.message));
    // Best-fit open jobs the student hasn't applied to (non-blocking).
    Promise.all([jobsApi.listOpen(), jobsApi.listFits(), applicationsApi.listMine()])
      .then(([j, f, a]) => {
        const applied = new Set(a.applications.map((x) => x.jobId));
        const ranked = j.jobs
          .filter((job) => !applied.has(job.id) && f.fits[job.id])
          .map((job) => ({ ...job, fit: f.fits[job.id].score }))
          .sort((x, y) => y.fit - x.fit)
          .slice(0, 4);
        setMatches({ hasResume: f.hasResume, jobs: ranked });
      })
      .catch(() => {});
  };

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!applications || !candidate) return <LoadingState />;

  const shortlisted = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const interviews = applications.filter((a) =>
    ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(a.status),
  ).length;
  const completeness = calcCompleteness(candidate);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Welcome{user?.candidate?.fullName ? `, ${user.candidate.fullName.split(' ')[0]}` : ''}
          </h2>
          <p className="text-sm text-slate-500">Find jobs that fit your resume, apply and track your interviews.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-brand-50 p-3">
            <FileText className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{applications.length}</p>
            <p className="text-sm text-slate-500">Applications</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-emerald-50 p-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{shortlisted}</p>
            <p className="text-sm text-slate-500">Shortlisted</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-violet-50 p-3">
            <CalendarClock className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{interviews}</p>
            <p className="text-sm text-slate-500">Interviews</p>
          </div>
        </Card>
      </div>

      {/* Profile completeness */}
      <CompletenessBar pct={completeness} />

      {/* Best matches */}
      <Card className="mb-8 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <Sparkles className="h-4 w-4 text-brand-600" /> Best matches for you
          </h3>
          <Link to="/candidate/jobs" className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-600">
            Browse all jobs
          </Link>
        </div>
        {!matches.hasResume ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Upload your resume and we'll rank every open job by how well you fit.</p>
            <Link to="/candidate/profile" className="shrink-0">
              <Button className="w-full sm:w-auto">
                <Upload className="h-4 w-4" /> Upload resume
              </Button>
            </Link>
          </div>
        ) : matches.jobs.length === 0 ? (
          <p className="text-sm text-slate-500">No new open jobs right now — check back soon.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {matches.jobs.map((job) => (
              <Link
                key={job.id}
                to={`/candidate/jobs/${job.id}`}
                className="flex min-h-[44px] items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{job.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {job.company?.name} · {job.location || 'Remote'}
                  </p>
                </div>
                <FitBadge score={job.fit} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Recent applications */}
      <Card className="p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Recent applications</h3>
        {applications.length === 0 ? (
          <p className="text-sm text-slate-500">
            You haven't applied to any jobs yet.{' '}
            <Link to="/candidate/jobs" className="font-medium text-brand-600">
              Find jobs
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {applications.slice(0, 5).map((app) => (
              <Link
                key={app.id}
                to={`/candidate/applications/${app.id}`}
                className="flex min-h-[44px] items-center justify-between gap-3 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{app.job.title}</p>
                  <p className="text-xs text-slate-500">{app.job.company.name}</p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
