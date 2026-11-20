import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, ChevronRight } from 'lucide-react';
import AuthShell from './AuthShell.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import FormField, { inputClass } from '../../components/ui/FormField.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import Button from '../../components/ui/Button.jsx';
import { homePathForRole } from '../../utils/homePath.js';
import { registerCompanySchema, registerCandidateSchema } from '../../../shared/schemas/auth.schema.js';
import { checkForm } from '../../../shared/schemas/common.js';

const field = `${inputClass} min-h-[44px]`;

function LoginLink() {
  return (
    <p className="mt-4 text-center text-sm text-slate-500">
      Already have an account?{' '}
      <Link to="/auth/login" className="font-medium text-brand-600 hover:text-brand-700">
        Log in
      </Link>
    </p>
  );
}

// Shared submit flow for both sign-up forms.
function useRegisterForm(schema, initial, submit) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { data, errors } = checkForm(schema, form);
    setFieldErrors(errors);
    if (!data) return setError('Please fix the highlighted fields');
    setLoading(true);
    try {
      const user = await submit(data);
      navigate(homePathForRole(user.role));
    } catch (err) {
      setFieldErrors(err.fields || {});
      setError(Object.keys(err.fields || {}).length ? 'Please fix the highlighted fields' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return { form, set, fieldErrors, error, loading, onSubmit };
}

export function RegisterChooserPage() {
  const options = [
    {
      to: '/auth/register/student',
      icon: GraduationCap,
      title: "I'm a student",
      text: 'Upload your resume, see how well you fit each job, apply and take interviews.',
    },
    {
      to: '/auth/register/company',
      icon: Building2,
      title: "I'm hiring for a company",
      text: 'Register your company, post jobs and add your HR team and employees.',
    },
  ];
  return (
    <AuthShell title="Create your account" subtitle="Choose how you'll use HireNova">
      <div className="space-y-3">
        {options.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-[44px] items-center gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <div className="shrink-0 rounded-lg bg-brand-50 p-3">
              <Icon className="h-5 w-5 text-brand-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{title}</p>
              <p className="text-sm text-slate-500">{text}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
      <LoginLink />
    </AuthShell>
  );
}

export function RegisterStudentPage() {
  const { registerCandidate } = useAuth();
  const { form, set, fieldErrors, error, loading, onSubmit } = useRegisterForm(
    registerCandidateSchema,
    { fullName: '', email: '', password: '', phone: '', location: '' },
    registerCandidate
  );

  return (
    <AuthShell title="Student sign up" subtitle="Find jobs that fit your resume">
      <form onSubmit={onSubmit} noValidate>
        <FormField label="Full name" error={fieldErrors.fullName}>
          <input className={field} value={form.fullName} onChange={set('fullName')} autoComplete="name" maxLength={120} />
        </FormField>
        <FormField label="Email" error={fieldErrors.email}>
          <input type="email" inputMode="email" className={field} value={form.email} onChange={set('email')} autoComplete="email" maxLength={254} placeholder="you@example.com" />
        </FormField>
        <FormField label="Password" error={fieldErrors.password} hint="At least 8 characters, with a letter and a number">
          <PasswordInput className="min-h-[44px]" value={form.password} onChange={set('password')} autoComplete="new-password" maxLength={72} />
        </FormField>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Phone (optional)" error={fieldErrors.phone}>
            <input type="tel" inputMode="tel" className={field} value={form.phone} onChange={set('phone')} autoComplete="tel" maxLength={20} />
          </FormField>
          <FormField label="City (optional)" error={fieldErrors.location}>
            <input className={field} value={form.location} onChange={set('location')} autoComplete="address-level2" maxLength={200} />
          </FormField>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Create student account
        </Button>
      </form>
      <LoginLink />
    </AuthShell>
  );
}

export function RegisterCompanyPage() {
  const { registerCompany } = useAuth();
  const { form, set, fieldErrors, error, loading, onSubmit } = useRegisterForm(
    registerCompanySchema,
    { companyName: '', fullName: '', email: '', password: '', industry: '', website: '', location: '' },
    registerCompany
  );

  return (
    <AuthShell title="Register your company" subtitle="You'll be the company admin — add HR and employees after sign-up">
      <form onSubmit={onSubmit} noValidate>
        <FormField label="Company name" error={fieldErrors.companyName}>
          <input className={field} value={form.companyName} onChange={set('companyName')} autoComplete="organization" maxLength={200} />
        </FormField>
        <FormField label="Your name" error={fieldErrors.fullName}>
          <input className={field} value={form.fullName} onChange={set('fullName')} autoComplete="name" maxLength={120} />
        </FormField>
        <FormField label="Work email" error={fieldErrors.email}>
          <input type="email" inputMode="email" className={field} value={form.email} onChange={set('email')} autoComplete="email" maxLength={254} placeholder="you@company.com" />
        </FormField>
        <FormField label="Password" error={fieldErrors.password} hint="At least 8 characters, with a letter and a number">
          <PasswordInput className="min-h-[44px]" value={form.password} onChange={set('password')} autoComplete="new-password" maxLength={72} />
        </FormField>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Industry / field" error={fieldErrors.industry} hint="e.g. IT services, Fintech">
            <input className={field} value={form.industry} onChange={set('industry')} maxLength={120} />
          </FormField>
          <FormField label="Location (optional)" error={fieldErrors.location}>
            <input className={field} value={form.location} onChange={set('location')} maxLength={200} />
          </FormField>
        </div>
        <FormField label="Website (optional)" error={fieldErrors.website}>
          <input type="url" inputMode="url" className={field} value={form.website} onChange={set('website')} placeholder="https://" maxLength={300} />
        </FormField>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Register company
        </Button>
      </form>
      <LoginLink />
    </AuthShell>
  );
}
