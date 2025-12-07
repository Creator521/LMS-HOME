export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  INTERESTED = 'Interested',
  NOT_INTERESTED = 'Not Interested',
  CLOSED_WON = 'Closed-Won',
  CLOSED_LOST = 'Closed-Lost'
}

export enum ServiceType {
  RENT = 'Rent',
  RESALE = 'Resale'
}

export enum PropertyType {
  APARTMENT = 'Apartment',
  INDEPENDENT_FLOOR = 'Independent Floor',
  NA = 'NA'
}

export interface Lead {
  id: string;
  lead_date: string; // ISO Date string YYYY-MM-DD
  lead_name: string;
  phone_number: string;
  email: string;
  service_type: ServiceType;
  property_type: PropertyType;
  status: LeadStatus;
  created_at: string;
}

export interface Comment {
  id: string;
  leadId: string;
  comment_text: string;
  timestamp: string;
  user: string; // mocking a username
}

export interface FilterState {
  search: string;
  status: string;
  serviceType: string;
  dateStart: string;
  dateEnd: string;
}