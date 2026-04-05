import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Users, BookOpen, Shield, FileClock, BarChart3, BellRing } from 'lucide-react';
import API from '../../lib/api/api';
import { logoutAllSessions } from '../../lib/api/auth';
import { useTheme } from '../../context/ThemeContext';
import { getUsers } from '../../lib/api/user';
import { changePassword, getActiveSessions, getPreferences, updatePreferences } from '../../lib/api/settings';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { tab } = useParams();
  const [adminCount, setAdminCount] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState('');
  const [securityMessage, setSecurityMessage] = useState('');
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; updatedAt: string; expiresAt: string; isCurrent: boolean }>>([]);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    timezone: 'Asia/Kolkata',
    theme: 'system' as 'light' | 'dark' | 'system'
  });

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'team-access', label: 'Team & Access' },
      { id: 'accounting-setup', label: 'Accounting Setup' },
      { id: 'security', label: 'Security' },
      { id: 'preferences', label: 'Preferences' },
      { id: 'activity', label: 'Activity' }
    ],
    []
  );

  const activeTab = tabs.some((item) => item.id === tab) ? String(tab) : 'overview';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [users, accountsRes] = await Promise.all([getUsers(), API.get('/accounts')]);
        setAdminCount(users.length);
        setAccountCount(Array.isArray(accountsRes.data) ? accountsRes.data.length : 0);
      } catch {
        setAdminCount(0);
        setAccountCount(0);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const loadPrefs = async () => {
      if (activeTab !== 'preferences') return;

      try {
        setPrefLoading(true);
        setPrefMessage('');
        const pref = await getPreferences();
        setPreferences(pref);
      } catch {
        setPrefMessage('Failed to load preferences');
      } finally {
        setPrefLoading(false);
      }
    };

    loadPrefs();
  }, [activeTab]);

  useEffect(() => {
    const loadSessions = async () => {
      if (activeTab !== 'security') return;

      try {
        setSessionsLoading(true);
        setSecurityMessage('');
        const data = await getActiveSessions();
        setSessions(data.map((s) => ({ id: s.id, updatedAt: s.updatedAt, expiresAt: s.expiresAt, isCurrent: s.isCurrent })));
      } catch {
        setSecurityMessage('Failed to load active sessions');
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [activeTab]);

  const cards = useMemo(
    () => [
      {
        title: 'Team & Access',
        description: 'Manage admins and add another admin account.',
        icon: Users,
        action: () => navigate('/users')
      },
      {
        title: 'Accounting Setup',
        description: 'Manage chart of accounts and balances.',
        icon: BookOpen,
        action: () => navigate('/accounting')
      },
      {
        title: 'Security',
        description: 'Password updates and active session management.',
        icon: Shield,
        action: () => navigate('/account/settings/security')
      },
      {
        title: 'Preferences',
        description: 'Currency, date format, timezone and theme defaults.',
        icon: Settings,
        action: () => navigate('/account/settings/preferences')
      },
      {
        title: 'Audit Activity',
        description: 'View account and admin actions in audit trail.',
        icon: FileClock,
        action: () => navigate('/audit-trail')
      },
      {
        title: 'Linked Reports',
        description: 'Open reports connected to account decisions.',
        icon: BarChart3,
        action: () => navigate('/reports/overview')
      }
    ],
    [navigate]
  );

  const renderPanel = () => {
    if (activeTab === 'team-access') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Team & Access</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create and maintain admin accounts for this project.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => navigate('/users')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Open Admin List</button>
            <button onClick={() => navigate('/users/add')} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Add Another Admin</button>
          </div>
        </div>
      );
    }

    if (activeTab === 'accounting-setup') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Accounting Setup</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Maintain chart of accounts and opening balances.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => navigate('/accounting')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">View Accounts</button>
            <button onClick={() => navigate('/accounting/add')} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Add Ledger Account</button>
          </div>
        </div>
      );
    }

    if (activeTab === 'security') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Security</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Change your password and manage active sessions.</p>

          {securityMessage && (
            <div className="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {securityMessage}
            </div>
          )}

          <form
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setPasswordSaving(true);
                await changePassword(passwordForm);
                setPasswordForm({ currentPassword: '', newPassword: '' });
                setSecurityMessage('Password updated successfully');
              } catch (err: any) {
                setSecurityMessage(err?.response?.data?.message || 'Failed to update password');
              } finally {
                setPasswordSaving(false);
              }
            }}
          >
            <input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              minLength={6}
              required
            />
            <button disabled={passwordSaving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              {passwordSaving ? 'Updating...' : 'Change Password'}
            </button>
          </form>

          <div className="mt-5 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b px-3 py-2 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Active Sessions</h4>
              <button
                onClick={async () => {
                  try {
                    await logoutAllSessions();
                    setSecurityMessage('Logged out all sessions');
                    setSessions([]);
                  } catch {
                    setSecurityMessage('Failed to logout all sessions');
                  }
                }}
                className="rounded border px-2.5 py-1 text-xs dark:border-gray-600 dark:text-gray-200"
              >
                Logout All
              </button>
            </div>
            {sessionsLoading ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">No active sessions found.</div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {sessions.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between px-3 py-2 text-sm">
                    <div className="text-gray-700 dark:text-gray-300">
                      Last seen: {new Date(s.updatedAt).toLocaleString()} | Expires: {new Date(s.expiresAt).toLocaleString()}
                    </div>
                    <span className={`rounded px-2 py-0.5 text-xs ${s.isCurrent ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>
                      {s.isCurrent ? 'Current' : 'Other'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'preferences') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <BellRing className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Preferences</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set currency, date format, timezone and theme defaults.</p>
            </div>
          </div>

          {prefMessage && (
            <div className="mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {prefMessage}
            </div>
          )}

          {prefLoading ? (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading preferences...</div>
          ) : (
            <form
              className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setPrefSaving(true);
                  setPrefMessage('');
                  const next = await updatePreferences(preferences);
                  setPreferences(next);
                  setTheme(next.theme);
                  setPrefMessage('Preferences saved');
                } catch {
                  setPrefMessage('Failed to save preferences');
                } finally {
                  setPrefSaving(false);
                }
              }}
            >
              <input
                value={preferences.currency}
                onChange={(e) => setPreferences((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                placeholder="Currency (e.g. INR)"
                className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <input
                value={preferences.dateFormat}
                onChange={(e) => setPreferences((prev) => ({ ...prev, dateFormat: e.target.value }))}
                placeholder="Date format"
                className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <input
                value={preferences.timezone}
                onChange={(e) => setPreferences((prev) => ({ ...prev, timezone: e.target.value }))}
                placeholder="Timezone"
                className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences((prev) => ({ ...prev, theme: e.target.value as 'light' | 'dark' | 'system' }))}
                className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>

              <div className="md:col-span-2">
                <button disabled={prefSaving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {prefSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}
        </div>
      );
    }

    if (activeTab === 'activity') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Activity</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open audit and reporting pages connected to account actions.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
            <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Reports</button>
            <button onClick={() => navigate('/users')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Users</button>
            <button onClick={() => navigate('/accounting')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Accounting</button>
            <button onClick={() => navigate('/calendar')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Calendar</button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.title}
              onClick={card.action}
              className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
            >
              <div className="mb-3 inline-flex rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                <card.icon size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{card.description}</p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Links</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => navigate('/users/add')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Add Admin</button>
            <button onClick={() => navigate('/accounting/add')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Add Ledger Account</button>
            <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Reports</button>
            <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
            <button onClick={() => navigate('/calendar')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Calendar</button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Central place for admin management, accounting setup, security, preferences, and activity links.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        Single-admin mode is active. You can add another admin manually from Team & Access.
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Admins</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{adminCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Ledger Accounts</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{accountCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Audit Links</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Ready</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Settings Phase</p>
          <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">2</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/account/settings/${item.id}`)}
            className={`rounded px-3 py-1.5 text-sm border transition ${
              activeTab === item.id
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {renderPanel()}
    </div>
  );
};

export default AccountSettings;
