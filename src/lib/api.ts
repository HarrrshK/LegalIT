import type { AuthUser, LegalCase, Lawyer } from '../types';

type ApiUser = {
  id: string;
  public_id: string;
  full_name: string;
  email: string;
  role: AuthUser['role'];
  status: AuthUser['status'];
  must_change_password?: boolean;
};

export function authUser(value: ApiUser): AuthUser {
  return {
    id: value.id,
    userId: value.public_id,
    fullName: value.full_name,
    email: value.email,
    role: value.role,
    status: value.status,
    mustChangePassword: value.must_change_password,
  };
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...init });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item: { loc?: string[]; msg?: string }) => `${item.loc?.slice(1).join('.') || 'Input'}: ${item.msg || 'Invalid value'}`).join('; ')
      : typeof detail === 'string' ? detail : 'The request could not be completed. Please try again.';
    throw new Error(message);
  }
  return body as T;
}

type ApiCase = {
  id: string;
  reference: string;
  title: string;
  case_type: string;
  status: string;
  jurisdiction: string | null;
  court_name: string | null;
  court_reference: string | null;
  summary: string | null;
  opened_at: string;
};

export function legalCase(value: ApiCase): LegalCase {
  const statusMap: Record<string, LegalCase['status']> = {
    pending_review: 'Pending Review', accepted: 'Accepted', rejected: 'Rejected',
    open: 'Active', active: 'Active', archived: 'Disposed',
  };
  return {
    id: value.id,
    cnrNumber: value.court_reference || value.reference,
    title: value.title,
    category: value.case_type as LegalCase['category'],
    status: statusMap[value.status] || 'Active',
    progressPercent: 0,
    filingDate: value.opened_at,
    courtName: value.court_name || value.jurisdiction || 'Not specified',
    bench: '',
    judgeName: '',
    opposingParty: '',
    assignedLawyer: emptyLawyer,
    summary: value.summary || '',
    timeline: [],
    documents: [],
    hearings: [],
  };
}

const emptyLawyer: Lawyer = {
  id: '', name: 'Not assigned', title: 'Advocate', barRegistration: '', experienceYears: 0,
  courtPractice: [], specializations: [], rating: 0, reviewCount: 0, location: '', distanceKm: 0,
  consultationFee: 0, photoUrl: '', phone: '', email: '', bio: '', availableSlots: [],
};

type ApiLawyer = {
  user_id: string;
  public_id: string;
  full_name: string;
  city: string | null;
  years_experience: number | null;
  bio: string | null;
  languages: string[];
  practice_areas: string[];
  verified: boolean;
  accepting_consultations: boolean;
};

export function lawyer(value: ApiLawyer): Lawyer {
  return {
    ...emptyLawyer,
    id: value.user_id,
    name: value.full_name,
    barRegistration: value.public_id,
    experienceYears: value.years_experience || 0,
    specializations: value.practice_areas as Lawyer['specializations'],
    courtPractice: value.languages,
    location: value.city || 'Not specified',
    bio: value.bio || '',
    verified: value.verified,
    acceptingConsultations: value.accepting_consultations,
  };
}
