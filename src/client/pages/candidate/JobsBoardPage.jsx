import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Briefcase, MapPin, Building2, Upload, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { jobsApi } from '../../services/jobs.js';
import { applicationsApi } from '../../services/applications.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import FitBadge from '../../components/ui/FitBadge.jsx';
import { inputClass } from '../../components/ui/FormField.jsx';

const TYPE_LABEL = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

const selectClass = `${inputClass} min-h-[44px]`;

// Every open job from every company, each with a quick resume-fit score.
export default function JobsBoardPage() {
  const [jobs, setJobs] = useState(null);
  const [fitData, setFitData] = useState({ hasResume: true, fits: {} });
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [sort, setSort] = useState('fit');
  const [showFilters, setShowFilters] = useState(false);

  const load = () => {
    setError('');
    setJobs(null);
    Promise.all([
      jobsApi.listOpen(search),
      jobsApi.listFits().catch(() => ({ hasResume: false, fits: {} })),
      applicationsApi.listMine().catch(() => ({ applications: [] })),
    ])
      .then(([j, f, a]) => {
        setJobs(j.jobs);
        setFitData(f);
        setAppliedJobIds(new Set(a.applications.map((app) => app.jobId)));
      })
      .catch((err) => setError(err.message));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [search]);

  const workModes = useMemo(() => [...new Set((jobs || []).map((j) => j.workMode).filter(Boolean))], [jobs]);

  const shown = useMemo(() => {
    if (!jobs) return [];
    const fitOf = (j) => fitData.fits[j.id]?.score ?? -1;
    return jobs
      .filter((j) => !type || j.employmentType === type)
      .filter((j) => !workMode || j.workMode === workMode)
      .sort((a, b) => (sort === 'fit' ? fitOf(b) - fitOf(a) : new Date(b.createdAt) - new Date(a.createdAt)));
  }, [jobs, fitData, type, workMode, sort]);

  const onSearch = (e) => {
    e.preventDefault();
    setSearch(query.trim());
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Find jobs</h2>
        <p className="text-sm text-slate-500">Open roles from every company, ranked by how well your resume fits</p>
      </div>

      {!fitData.hasResume && (
        <Card className="mb-4 flex flex-col gap-3 border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Upload className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <p className="font-medium text-slate-900">Upload your resume to see your fit</p>
              <p className="text-sm text-slate-600">We'll score every job against your skills, experience and education.</p>
            </div>
          </div>
          <Link to="/candidate/profile" className="shrink-0">
            <Button className="w-full sm:w-auto">Upload resume</Button>
          </Link>
        </Card>
      )}

      {/* Search + filters */}
      <form onSubmit={onSearch} className="mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className={`${inputClass} min-h-[44px] pl-9`}
            placeholder="Job title, company, city or skill"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            aria-label="Search jobs"
          />
        </div>
        <Button type="submit" className="shrink-0">
          Search
        </Button>
        <Button
          variant="secondary"
          className="shrink-0 md:hidden"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>
      <div className={`mb-5 grid gap-2 sm:grid-cols-3 ${showFilters ? '' : 'hidden md:grid'}`}>
        <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)} aria-label="Job type">
          <option value="">All job types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className={selectClass} value={workMode} onChange={(e) => setWorkMode(e.target.value)} aria-label="Work mode">
          <option value="">Any work mode</option>
          {workModes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          <option value="fit">Best fit first</option>
          <option value="new">Newest first</option>
        </select>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !jobs && <LoadingState label="Loading jobs…" />}

      {jobs && shown.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title={search || type || workMode ? 'No jobs match your search' : 'No open jobs right now'}
          description={search || type || workMode ? 'Try different keywords or clear the filters.' : 'Check back soon — companies post new roles regularly.'}
        />
      )}

      {jobs && shown.length > 0 && (
        <>
          <p className="mb-3 text-xs text-slate-500">
            {shown.length} job{shown.length === 1 ? '' : 's'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((job) => {
              const fit = fitData.fits[job.id];
              const applied = appliedJobIds.has(job.id);
              return (
                <Link key={job.id} to={`/candidate/jobs/${job.id}`} className="group block min-w-0">
                  <Card className="flex h-full flex-col p-4 transition-shadow group-hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">{job.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-600">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{job.company?.name}</span>
                        </p>
                      </div>
                      {fit && <FitBadge score={fit.score} />}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location || 'Remote'}
                      </span>
                      <span>{job.workMode}</span>
                      <span>{TYPE_LABEL[job.employmentType] || job.employmentType}</span>
                      {job.company?.industry && <span>{job.company.industry}</span>}
                    </div>

                    {job.requiredSkills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {job.requiredSkills.slice(0, 5).map((s) => {
                          const have = fit?.matchedSkills?.some((m) => m.toLowerCase() === s.toLowerCase());
                          return (
                            <span
                              key={s}
                              className={`rounded px-2 py-0.5 text-xs ${have ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                            >
                              {s}
                            </span>
                          );
                        })}
                        {job.requiredSkills.length > 5 && (
                          <span className="px-1 text-xs text-slate-400">+{job.requiredSkills.length - 5}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
                      <span className="text-slate-400">{new Date(job.createdAt).toLocaleDateString()}</span>
                      {applied ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Applied
                        </span>
                      ) : (
                        <span className="font-medium text-brand-600">View & check fit →</span>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
