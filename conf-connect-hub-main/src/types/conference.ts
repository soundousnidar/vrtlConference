export enum VenueEnum {
  ONLINE = 'ONLINE',
  IN_PERSON = 'IN_PERSON'
}

export enum AbstractStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected"
}

export enum InvitationStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected"
}

export enum ConferenceStatus {
  ACTIVE = 'active',
  TERMINATED = 'terminated'
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  affiliation?: string;
}

export interface Conference {
  id: number;
  title: string;
  description: string;
  deadline: string;
  important_date: string;
  fees: number;
  venue: VenueEnum;
  thematic: string[];
  organizer_id: number;
  organizer_name: string;
  image_url?: string;
  created_at: string;
  tags?: string[];
  status: ConferenceStatus;
}

export interface Author {
  id?: number;
  first_name: string;
  last_name: string;
  email?: string;
  affiliation?: string;
}

export interface Abstract {
  id: number;
  title: string;
  summary: string;
  keywords: string;
  submitted_at: string;
  updated_at: string;
  status: AbstractStatus;
  logs?: string;
  file_filename?: string;
  user_id: number;
  conference_id: number;
  user: User;
  conference: Conference;
  authors: Author[];
}

export interface Review {
  id: number;
  reviewer_id: number;
  abstract_id: number;
  rating: number;
  comment: string;
  reviewer: User;
  abstract: Abstract;
}

export interface ReviewerInvitation {
  id: number;
  conference_id: number;
  conference_title: string;
  invited_by_id: number;
  invitee_id?: number;
  invitee_email: string;
  status: InvitationStatus;
  created_at: string;
}

export interface Reviewer {
  id: number;
  user_id: number;
  conference_id: number;
  user: User;
  conference: Conference;
}
