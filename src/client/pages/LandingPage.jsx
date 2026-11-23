import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  ScanSearch,
  Mic,
  FileBarChart2,
  Users,
  ShieldCheck,
  Upload,
  Search,
  Send,
  ArrowRight,
  PlayCircle,
} from 'lucide-react';

// Product demo video (YouTube). Embedded with the privacy-friendly nocookie domain.
const DEMO_VIDEO_URL = 'https://youtu.be/XTdOMj9Muds';
const DEMO_VIDEO_EMBED = 'https://www.youtube-nocookie.com/embed/XTdOMj9Muds';

// Direct-hiring model: companies register and post jobs; students sign up,
// upload a resume, see their fit for each job, apply and take AI interviews.
const STUDENT_STEPS = [
  { icon: Upload, title: 'Upload your resume', text: 'PDF or DOCX — we read your skills, experience and education.' },
  { icon: Search, title: 'See your fit', text: 'Every open job is scored against your resume, with skills to build.' },
  { icon: Send, title: 'Apply in one click', text: 'Apply to jobs from any company on the platform.' },
  { icon: Mic, title: 'Take the AI interview', text: 'Shortlisted? Interview online when it suits you.' },
];

const COMPANY_FEATURES = [
  {
    icon: Users,
    title: 'Your team, your rules',
    description: 'Add HR and employees and pick exactly what each can do — create, edit or delete jobs, review candidates, or read only.',
  },
  {
    icon: ScanSearch,
    title: 'AI resume screening',
    description: 'Applicants are ranked by skills, experience and education against each job — no manual CV sorting.',
  },
  {
    icon: Mic,
    title: 'AI voice interviews',
    description: 'Your interviewer persona, custom questions and evaluation criteria, with adaptive follow-ups.',
  },
  {
    icon: FileBarChart2,
    title: 'Reports and final scores',
    description: 'Strengths, gaps, the full transcript and a final score combining CV and interview.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified, fair process',
    description: 'Gender and other personal traits are never used in scoring. Every decision stays with your team.',
  },
  {
    icon: Building2,
    title: 'Register in a minute',
    description: 'Sign up your company, post your first job and start receiving applicants the same day.',
  },
];

const ctaPrimary =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 text-sm font-semibold text-white hover:bg-brand-700';
const ctaSecondary =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-5 sm:px-6">
        <div className="flex shrink-0 items-center gap-2">
          <img src="/logo-mark.png" alt="HireNova" className="h-10 w-auto shrink-0 object-contain" />
          <span className="hidden text-lg font-semibold sm:inline">HireNova</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            to="/auth/register"
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-brand-600 hover:bg-brand-50 sm:px-3"
          >
            Sign up
          </Link>
          <Link
            to="/auth/login"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700 sm:px-4"
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-14 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <ScanSearch className="h-3.5 w-3.5" /> AI resume fit · AI voice interviews
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Where students find the right job and companies hire faster
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          Students upload a resume and see how well they fit every open role. Companies post jobs, get AI-ranked applicants
          and run AI interviews — with their whole hiring team on board.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/auth/register/student" className={ctaPrimary}>
            <GraduationCap className="h-4 w-4" /> I'm a student
          </Link>
          <Link to="/auth/register/company" className={ctaSecondary}>
            <Building2 className="h-4 w-4" /> Register your company
          </Link>
          <Link to="/live-demo" className={ctaSecondary}>
            <PlayCircle className="h-4 w-4" /> Try the live demo
          </Link>
        </div>
        <p className="mt-5 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>{' '}
          ·{' '}
          <a href="#demo-video" className="font-medium text-brand-600 hover:text-brand-700">
            Watch the demo video
          </a>
        </p>
      </section>

      {/* Product demo video */}
      <section id="demo-video" className="mx-auto max-w-4xl scroll-mt-6 px-4 pb-14 sm:px-6 sm:pb-16">
        <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">See HireNova in action</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600 sm:text-base">
          A quick tour: AI job creation, resume screening, job-fit scores and the AI interview room.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-lg">
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src={DEMO_VIDEO_EMBED}
              title="HireNova product demo"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
        <div className="mt-4 text-center">
          <a
            href={DEMO_VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <PlayCircle className="h-4 w-4" /> Watch on YouTube
          </a>
        </div>
      </section>

      {/* For students */}
      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">For students</h2>
          <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STUDENT_STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative flex gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-col lg:gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Step {i + 1}</p>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
                {i < STUDENT_STEPS.length - 1 && (
                  <ArrowRight className="absolute -right-3.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-slate-300 lg:block" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link to="/auth/register/student" className={ctaPrimary}>
              Create a free student account
            </Link>
          </div>
        </div>
      </section>

      {/* For companies */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">For companies</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border border-slate-200 p-5 sm:p-6">
              <Icon className="h-6 w-6 text-brand-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/auth/register/company" className={ctaSecondary}>
            <Building2 className="h-4 w-4" /> Register your company
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} HireNova · Crafted with skills by OrbitDevStudio in India
      </footer>
    </div>
  );
}
