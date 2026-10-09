import type { ClientProfile, LegalCase, LegalUpdate, Lawyer, NotificationItem } from '../types';

export const cases: LegalCase[] = [];
export const lawyers: Lawyer[] = [];
export const legalUpdates: LegalUpdate[] = [];
export const notifications: NotificationItem[] = [];
export const assignedLawyer: Lawyer | null = null;

export const emptyClientProfile: ClientProfile = {
  id: '',
  name: '',
  clientId: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  avatarUrl: '',
  emergencyContact: '',
  preferredLanguage: 'English',
  notificationsEnabled: { email: true, sms: false, whatsapp: false },
};
