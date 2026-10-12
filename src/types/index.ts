export type CaseStatus = 'Pending Review' | 'Accepted' | 'Rejected' | 'Active' | 'In Hearing' | 'Judgment Reserved' | 'Disposed' | 'Pending Notice';

export type UserRole = 'client' | 'lawyer' | 'admin';

export interface AuthUser {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  mustChangePassword?: boolean;
}

export type LegalDomain = 'Property & Real Estate' | 'Consumer Protection' | 'Civil Dispute' | 'Employment & Contract' | 'Family Law' | 'Intellectual Property';

export interface TimelineStep {
  id: string;
  stage: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
  documentsAttached?: string[];
  benchNotes?: string;
}

export interface LegalDocument {
  id: string;
  caseId: string;
  caseTitle: string;
  title: string;
  category: 'Pleading' | 'Affidavit' | 'Court Order' | 'Evidence' | 'Vakalatnama' | 'Legal Notice';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: 'Client' | 'Advocate' | 'Court registry';
  status: 'Verified' | 'Pending Review' | 'Draft';
  downloadUrl?: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  caseTitle: string;
  cnrNumber: string;
  courtName: string;
  bench: string;
  roomNumber: string;
  date: string;
  time: string;
  stage: string;
  judgeName: string;
  status: 'Upcoming' | 'Completed' | 'Adjourned';
  previousOrderSummary?: string;
  purpose: string;
}

export interface Lawyer {
  id: string;
  name: string;
  title: string;
  barRegistration: string;
  experienceYears: number;
  courtPractice: string[];
  specializations: LegalDomain[];
  rating: number;
  reviewCount: number;
  location: string;
  distanceKm: number;
  consultationFee: number;
  photoUrl: string;
  phone: string;
  email: string;
  bio: string;
  availableSlots?: string[];
  isAssigned?: boolean;
  verified?: boolean;
  acceptingConsultations?: boolean;
}

export interface LegalCase {
  id: string;
  cnrNumber: string;
  title: string;
  category: LegalDomain;
  status: CaseStatus;
  progressPercent: number;
  filingDate: string;
  courtName: string;
  bench: string;
  judgeName: string;
  opposingParty: string;
  assignedLawyer: Lawyer;
  summary: string;
  nextHearing?: Hearing;
  timeline: TimelineStep[];
  documents: LegalDocument[];
  hearings: Hearing[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  legalSections?: {
    actName: string;
    section: string;
    title: string;
    description: string;
  }[];
  citations?: {
    caseTitle: string;
    citation: string;
    relevance: string;
  }[];
  suggestedActions?: string[];
}

export interface LegalUpdate {
  id: string;
  title: string;
  category: 'Supreme Court' | 'High Courts' | 'Acts & Amendments' | 'Rules & Regulations' | 'Notifications';
  courtOrBody: string;
  date: string;
  impactLevel: 'High Impact' | 'Important' | 'General';
  summary: string;
  keyTakeaway: string;
  fullContent: string;
  relevantCaseCategory?: LegalDomain;
  officialLink?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'hearing' | 'document' | 'lawyer' | 'ai' | 'update';
  read: boolean;
  linkTab?: string;
  caseId?: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  clientId: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  avatarUrl: string;
  emergencyContact: string;
  preferredLanguage: string;
  notificationsEnabled: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}
