import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Sparkles,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  AlertTriangle,
  Upload,
  Send,
  Globe,
} from 'lucide-react';
import { jobsApi } from '../../services/jobs.js';
import { resumesApi } from '../../services/resumes.js';
import { applicationsApi } from '../../services/applications.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import ScoreRing from '../../components/ui/ScoreRing.jsx';
import FitBadge, { fitTone } from '../../components/ui/FitBadge.jsx';
import { inputClass } from '../../components/ui/FormField.jsx';
import { safeHttpUrl } from '../../utils/safeUrl.js';

const TYPE_LABEL = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

function Tags({ items, tone = 'slate' }) {
  if (!items?.length) return <p className="text-sm text-slate-400">Not specified</p>;
  const cls = { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700' }[tone];
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <span key={s} className={`rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

function ScoreBar({ label, value }) {
  const v = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  const bar = v >= 75 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{v}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function FitResult({ fit }) {
  const tone = fitTone(fit.score);
  return (
    <div>
      <div className="flex items-center gap-4">
        <ScoreRing score={fit.score} size={64} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{tone.label}</p>
          <p className="text-xs text-slate-500">
            {fit.source === 'ai' ? 'AI review of your resume against this job' : 'Quick check (skills, experience, education)'}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <ScoreBar label="Skills" value={fit.skillMatchScore} />
        <ScoreBar label="Experience" value={fit.experienceMatchScore} />
        <ScoreBar label="Education" value={fit.educationMatchScore} />
      </div>
      {fit.summary && <p className="mt-4 text-sm text-slate-600">{fit.summary}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Skills you have
          </p>
          <Tags items={fit.matchedSkills} tone="green" />
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            <XCircle className="h-3.5 w-3.5 text-rose-500" /> Skills to build
          </p>
          {fit.missingSkills?.length ? <Tags items={fit.missingSkills} tone="red" /> : <p className="text-sm text-slate-400">None — nice!</p>}
        </div>
      </div>

      {(fit.strengths?.length > 0 || fit.concerns?.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {fit.strengths?.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" /> Strengths
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                {fit.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {fit.concerns?.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Gaps to address
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
                {fit.concerns.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [existing, setExisting] = useState(null);
  const [quick, setQuick] = useState(null);
  const [fit, setFit] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');

  const load = () => {
    setError('');
    Promise.all([
      jobsApi.get(id),
      resumesApi.list(),
      applicationsApi.listMine(),
      jobsApi.listFits().catch(() => ({ fits: {} })),
    ])
      .then(([j, r, a, f]) => {
        setJob(j.job);
        setResumes(r.resumes);
        setResumeId((r.resumes.find((x) => x.isPrimary) || r.resumes[0])?.id || '');
        setExisting(a.applications.find((app) => app.jobId === id) || null);
        setQuick(f.fits?.[id] || null);
      })
      .catch((err) => setError(err.message));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);

  const checkFit = async () => {
    setBusy('fit');
    setActionError('');
    try {
      const { fit: result } = await jobsApi.checkFit(id);
      setFit(result);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy('');
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('upload');
    setActionError('');
    try {
      const { resume } = await resumesApi.upload(file);
      setResumes((list) => [resume, ...list]);
      setResumeId(resume.id);
      setFit(null);
      jobsApi.listFits().then((f) => setQuick(f.fits?.[id] || null)).catch(() => {});
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy('');
    }
  };

  const apply = async () => {
    if (!resumeId) return setActionError('Upload a resume first');
    setBusy('apply');
    setActionError('');
    try {
      const { application } = await applicationsApi.apply({ jobId: id, resumeId });
      navigate(`/candidate/applications/${application.id}`);
    } catch (err) {
      setActionError(err.message);
      setBusy('');
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!job) return <LoadingState />;

  const website = safeHttpUrl(job.company?.website);
  const hasResume = resumes.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/candidate/jobs" className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Job details */}
        <div className="min-w-0 space-y-6">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{job.company?.name}</span>
                  {job.company?.industry && <span className="hidden text-slate-400 sm:inline">· {job.company.industry}</span>}
                </p>
              </div>
              {quick && <FitBadge score={quick.score} />}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {job.location || 'Remote'}
              </span>
              <span>{job.workMode}</span>
              <span>{TYPE_LABEL[job.employmentType] || job.employmentType}</span>
              <span>{job.jobLevel} level</span>
              <span>
                {job.minimumExperience}
                {job.maximumExperience != null ? `–${job.maximumExperience}` : '+'} yrs
              </span>
              {job.salaryRange && <span>{job.salaryRange}</span>}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 font-semibold text-slate-900">About the role</h3>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">{job.description}</p>
          </Card>

          <Card className="space-y-4 p-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Required skills</h3>
              <Tags items={job.requiredSkills} />
            </div>
            {job.preferredSkills?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Nice to have</h3>
                <Tags items={job.preferredSkills} />
              </div>
            )}
            {job.educationRequirements?.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Education</h3>
                <Tags items={job.educationRequirements} />
              </div>
            )}
          </Card>

          {(job.company?.description || website) && (
            <Card className="p-5">
              <h3 className="mb-2 font-semibold text-slate-900">About {job.company.name}</h3>
              {job.company.description && <p className="text-sm text-slate-700">{job.company.description}</p>}
              {website && (
                <a href={website} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-brand-600">
                  <Globe className="h-4 w-4" /> Company website
                </a>
              )}
            </Card>
          )}
        </div>

        {/* Fit + apply — sticky beside the details on large screens */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-brand-600" /> Your resume fit
            </h3>
            {!hasResume ? (
              <p className="text-sm text-slate-500">Upload your resume to see how well you match this job.</p>
            ) : fit ? (
              <FitResult fit={fit} />
            ) : (
              <>
                {quick && (
                  <p className="mb-3 text-sm text-slate-600">
                    Quick score: <span className="font-semibold">{quick.score}%</span>. Get a detailed AI review with strengths and gaps.
                  </p>
                )}
                <Button onClick={checkFit} loading={busy === 'fit'} className="w-full">
                  <Sparkles className="h-4 w-4" /> Check my fit
                </Button>
              </>
            )}
          </Card>

          <Card className="p-5">
            {existing ? (
              <>
                <p className="flex items-center gap-2 font-medium text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" /> You've applied
                </p>
                <Link to={`/candidate/applications/${existing.id}`} className="mt-3 block">
                  <Button variant="secondary" className="w-full">
                    View application & interview
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="mb-3 font-semibold text-slate-900">Apply</h3>
                {hasResume && (
                  <label className="mb-3 block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Resume to send</span>
                    <select className={`${inputClass} min-h-[44px]`} value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.fileName}
                          {r.isPrimary ? ' (primary)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={upload} />
                <div className="space-y-2">
                  {hasResume && (
                    <Button onClick={apply} loading={busy === 'apply'} className="w-full">
                      <Send className="h-4 w-4" /> Apply now
                    </Button>
                  )}
                  <Button
                    variant={hasResume ? 'ghost' : 'primary'}
                    onClick={() => fileRef.current?.click()}
                    loading={busy === 'upload'}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4" /> {hasResume ? 'Upload a different resume' : 'Upload resume (PDF or DOCX)'}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  After you apply, the company reviews your profile. If shortlisted you'll be invited to an AI interview here.
                </p>
              </>
            )}
            {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
