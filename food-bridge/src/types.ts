export type Language = 'en' | 'bn';

export interface DonationSubmission {
  id: string;
  donorName: string;
  organization?: string;
  phone: string;
  foodType: string;
  quantityKg: number;
  servings: number;
  cookedTime: string;
  district: string;
  address: string;
  notes?: string;
  timestamp: string;
}

export interface SupportRequestSubmission {
  id: string;
  shelterName: string;
  contactPerson: string;
  phone: string;
  district: string;
  address: string;
  mealsNeeded: number;
  urgency: 'critical' | 'today' | 'recurring';
  notes?: string;
  timestamp: string;
}

export interface VolunteerSubmission {
  id: string;
  name: string;
  phone: string;
  district: string;
  transportMode: 'bicycle' | 'motorbike' | 'van' | 'walking';
  availability: string;
  timestamp: string;
}

export interface LiveRescueItem {
  id: string;
  donorLocation: string;
  shelterDestination: string;
  foodDescription: string;
  quantity: string;
  timeAgo: string;
  status: 'delivered' | 'in_transit' | 'matched';
  district: string;
}
