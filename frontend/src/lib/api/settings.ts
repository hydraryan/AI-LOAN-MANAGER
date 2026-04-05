import API from './api';

export type PreferencesPayload = {
  currency: string;
  dateFormat: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
};

export type ActiveSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lastSeenAt?: string;
  isCurrent: boolean;
};

export const getPreferences = async (): Promise<PreferencesPayload> => {
  const res = await API.get('/settings/preferences');
  return res.data;
};

export const updatePreferences = async (payload: PreferencesPayload): Promise<PreferencesPayload> => {
  const res = await API.put('/settings/preferences', payload);
  return res.data;
};

export const getActiveSessions = async (): Promise<ActiveSession[]> => {
  const res = await API.get('/auth/sessions');
  return res.data?.data?.sessions || [];
};

export const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const res = await API.post('/auth/change-password', payload);
  return res.data;
};
