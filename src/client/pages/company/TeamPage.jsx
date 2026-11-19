import { useEffect, useState } from 'react';
import { UserPlus, Users, Send, Pencil, ShieldCheck } from 'lucide-react';
import { recruitersApi } from '../../services/recruiters.js';
import { PERMISSION_OPTIONS, ROLE_PRESETS, MEMBER_ROLE_LABELS } from '../../../shared/constants/permissions.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import FormField, { inputClass } from '../../components/ui/FormField.jsx';
import SetupLinkNotice from '../admin/SetupLinkNotice.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { inviteRecruiterSchema, updateRecruiterSchema } from '../../../shared/schemas/recruiter.schema.js';
import { checkForm } from '../../../shared/schemas/common.js';

const PERMISSION_LABEL = Object.fromEntries(PERMISSION_OPTIONS.map((p) => [p.key, p.label]));

const ROLE_CHOICES = [
  { key: 'HR', label: 'HR', description: 'Posts jobs, reviews candidates, runs interviews' },
  { key: 'EMPLOYEE', label: 'Employee', description: 'Read-only by default — sees jobs and candidates' },
];

const ROLE_BADGE = {
  OWNER: 'bg-violet-50 text-violet-700',
  HR: 'bg-brand-50 text-brand-700',
  EMPLOYEE: 'bg-slate-100 text-slate-700',
};

function memberStatus(m) {
  if (m.pendingInvite) return 'INVITED';
  return m.isActive ? 'ACTIVE' : 'INACTIVE';
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[role] || ROLE_BADGE.EMPLOYEE}`}>
      {MEMBER_ROLE_LABELS[role] || role}
    </span>
  );
}

const toggleIn = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

// Create (member = null) or edit an HR / employee.
function MemberModal({ open, member, onClose, onSaved }) {
  const editing = Boolean(member);
  const blank = { fullName: '', email: '', memberRole: 'EMPLOYEE', permissions: ROLE_PRESETS.EMPLOYEE };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setFieldErrors({});
    setForm(
      member
        ? { fullName: member.fullName || '', email: member.email, memberRole: member.role, permissions: member.permissions }
        : blank
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member]);

  // Picking a role loads its preset; the Admin can then fine-tune each box.
  const pickRole = (memberRole) => setForm((f) => ({ ...f, memberRole, permissions: ROLE_PRESETS[memberRole] }));

  const save = async () => {
    setError('');
    const { data, errors } = editing
      ? checkForm(updateRecruiterSchema, { fullName: form.fullName, memberRole: form.memberRole })
      : checkForm(inviteRecruiterSchema, {
          fullName: form.fullName,
          email: form.email,
          memberRole: form.memberRole,
          permissions: form.permissions,
          jobIds: [],
        });
    setFieldErrors(errors);
    if (!data) return setError('Please fix the highlighted fields');
    setSaving(true);
    try {
      if (editing) {
        await recruitersApi.update(member.id, data);
        const { recruiter } = await recruitersApi.setPermissions(member.id, form.permissions);
        onSaved({ recruiter });
      } else {
        onSaved(await recruitersApi.invite(data));
      }
    } catch (err) {
      const fields = err.fields || {};
      setFieldErrors(fields);
      setError(Object.keys(fields).length ? 'Please fix the highlighted fields' : err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={editing ? `Edit ${member?.fullName || member?.email}` : 'Add team member'}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={save} loading={saving} className="w-full sm:w-auto">
            {editing ? 'Save changes' : 'Send invite'}
          </Button>
        </div>
      }
    >
      <FormField label="Full name" error={fieldErrors.fullName}>
        <input
          className={`${inputClass} min-h-[44px]`}
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          placeholder="e.g. Riya Sharma"
          autoComplete="off"
          maxLength={120}
        />
      </FormField>
      {editing ? (
        <FormField label="Email">
          <p className="break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{form.email}</p>
        </FormField>
      ) : (
        <FormField label="Email" error={fieldErrors.email} hint="They'll get an email link to set their password">
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            className={`${inputClass} min-h-[44px]`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@company.com"
            maxLength={254}
          />
        </FormField>
      )}

      <p className="mb-2 text-sm font-medium text-slate-700">Role</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Role">
        {ROLE_CHOICES.map((r) => {
          const active = form.memberRole === r.key;
          return (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pickRole(r.key)}
              className={`min-h-[44px] rounded-lg border p-3 text-left transition-colors ${
                active ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-medium text-slate-900">{r.label}</span>
              <span className="block text-xs text-slate-500">{r.description}</span>
            </button>
          );
        })}
      </div>
      {fieldErrors.memberRole && <p role="alert" className="-mt-2 mb-3 text-xs text-red-600">{fieldErrors.memberRole}</p>}

      <p className="mb-1 text-sm font-medium text-slate-700">Permissions</p>
      <p className="mb-2 text-xs text-slate-500">Choosing a role fills in suggested permissions — adjust them as needed.</p>
      <div className="space-y-1">
        {PERMISSION_OPTIONS.map((o) => (
          <label key={o.key} className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={form.permissions.includes(o.key)}
              onChange={() => setForm({ ...form, permissions: toggleIn(form.permissions, o.key) })}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-800">{o.label}</span>
              <span className="block text-xs text-slate-500">{o.description}</span>
            </span>
          </label>
        ))}
      </div>
      {form.permissions.length === 0 && (
        <p className="mt-2 text-xs text-amber-700">With no permissions they can only see the job list.</p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}

// Company Admin (or a member with "Manage team") creates HR / employees and
// decides exactly what each one can do.
export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, member: null });
  const [notice, setNotice] = useState(null);
  const [confirmOff, setConfirmOff] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = () => {
    setError('');
    recruitersApi
      .list()
      .then((r) => setMembers(r.members))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const replace = (m) =>
    setMembers((list) => (list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m]));

  const setStatus = async (m, isActive) => {
    setBusyId(m.id);
    setActionError('');
    try {
      const { recruiter } = await recruitersApi.setStatus(m.id, isActive);
      replace(recruiter);
      setConfirmOff(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const resend = async (m) => {
    setBusyId(m.id);
    setActionError('');
    try {
      const { setupLink } = await recruitersApi.resendInvite(m.id);
      setNotice({ email: m.email, link: setupLink });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const isSelf = (m) => m.userId === user?.id;
  const displayName = (m) => m.fullName || (m.role === 'OWNER' ? 'Company admin' : m.email);

  const Actions = ({ m }) => {
    if (m.role === 'OWNER' || isSelf(m)) return null;
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setModal({ open: true, member: m })}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
        {m.pendingInvite && (
          <Button variant="secondary" loading={busyId === m.id} onClick={() => resend(m)}>
            <Send className="h-4 w-4" /> Resend
          </Button>
        )}
        {m.isActive ? (
          <Button variant="ghost" onClick={() => setConfirmOff(m)}>
            Deactivate
          </Button>
        ) : (
          <Button variant="secondary" loading={busyId === m.id} onClick={() => setStatus(m, true)}>
            Activate
          </Button>
        )}
      </div>
    );
  };

  const PermissionTags = ({ m }) =>
    m.role === 'OWNER' ? (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" /> Full access
      </span>
    ) : m.permissions.length ? (
      <div className="flex flex-wrap gap-1">
        {m.permissions.map((p) => (
          <span key={p} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {PERMISSION_LABEL[p] || p}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-xs text-slate-400">No permissions</span>
    );

  const counts = members
    ? { ALL: members.length, HR: members.filter((m) => m.role === 'HR').length, EMPLOYEE: members.filter((m) => m.role === 'EMPLOYEE').length }
    : {};
  const shown = members ? members.filter((m) => filter === 'ALL' || m.role === filter) : [];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Team</h2>
          <p className="text-sm text-slate-500">Add HR and employees and choose what each person can do</p>
        </div>
        <Button onClick={() => setModal({ open: true, member: null })} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4" /> Add team member
        </Button>
      </div>

      {notice && (
        <div className="mb-4">
          <SetupLinkNotice email={notice.email} link={notice.link} who="the team member" />
        </div>
      )}
      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}
      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !members && <LoadingState />}

      {members && (
        <>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {[
              ['ALL', 'Everyone'],
              ['HR', 'HR'],
              ['EMPLOYEE', 'Employees'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`min-h-[40px] shrink-0 rounded-full px-4 text-sm font-medium ${
                  filter === key ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label} <span className="opacity-70">({counts[key]})</span>
              </button>
            ))}
          </div>

          {members.length === 1 && (
            <Card className="mb-4 flex flex-col items-center gap-2 p-6 text-center">
              <Users className="h-8 w-8 text-slate-300" />
              <p className="font-medium text-slate-700">It's just you so far</p>
              <p className="text-sm text-slate-500">Add HR to post jobs and review candidates, or employees with read-only access.</p>
            </Card>
          )}

          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {shown.map((m) => (
              <Card key={m.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {displayName(m)} {isSelf(m) && <span className="text-xs text-slate-400">(you)</span>}
                    </p>
                    <p className="truncate text-sm text-slate-500">{m.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <RoleBadge role={m.role} />
                    {m.role !== 'OWNER' && <StatusBadge status={memberStatus(m)} />}
                  </div>
                </div>
                <div className="mt-3">
                  <PermissionTags m={m} />
                </div>
                <div className="mt-3">
                  <Actions m={m} />
                </div>
              </Card>
            ))}
          </div>

          {/* Tablet/desktop: table */}
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Permissions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((m) => (
                  <tr key={m.id} className="align-top hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900">
                        {displayName(m)} {isSelf(m) && <span className="text-xs font-normal text-slate-400">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{m.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={m.role} />
                    </td>
                    <td className="max-w-[300px] px-5 py-3">
                      <PermissionTags m={m} />
                    </td>
                    <td className="px-5 py-3">{m.role === 'OWNER' ? '—' : <StatusBadge status={memberStatus(m)} />}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Actions m={m} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <MemberModal
        open={modal.open}
        member={modal.member}
        onClose={() => setModal({ open: false, member: null })}
        onSaved={(result) => {
          replace(result.recruiter);
          if (result.setupLink) setNotice({ email: result.recruiter.email, link: result.setupLink });
          setModal({ open: false, member: null });
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmOff)}
        title="Deactivate this team member?"
        description={confirmOff ? `${confirmOff.fullName || confirmOff.email} won't be able to log in. Jobs they created stay with the company.` : ''}
        confirmLabel="Deactivate"
        loading={busyId === confirmOff?.id}
        onConfirm={() => setStatus(confirmOff, false)}
        onCancel={() => setConfirmOff(null)}
      />
    </div>
  );
}
