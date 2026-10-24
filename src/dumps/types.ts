export type WasteCategory =
  | 'plastic'
  | 'organic'
  | 'construction'
  | 'hazardous'
  | 'electronic'
  | 'metal'
  | 'textile'
  | 'mixed';

export type DumpSeverity = 'low' | 'medium' | 'high' | 'critical';

export type DumpStatus =
  | 'reported'
  | 'dispatched_to_government'
  | 'assigned_sweeper'
  | 'in_progress'
  | 'cleaned';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  accuracyMeters?: number;
}

export interface GovernmentDispatchRecord {
  ticketNumber: string;
  dispatchedAt: string;
  departmentName: string;
  grievancePortal: string;
  assignedOfficer?: string;
  estimatedResolutionHours: number;
  officialNotes: string;
  dossierHash: string;
}

export interface DumpReport {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  afterImageUrl?: string;
  location: GeoLocation;
  categories: WasteCategory[];
  severity: DumpSeverity;
  estimatedWeightKg: number;
  hazardScore: number; // 1 - 10
  healthRisks: string[];
  recommendedEquipment: string[];
  status: DumpStatus;
  createdAt: string;
  updatedAt: string;
  reportedBy: {
    name: string;
    contact?: string;
    isAnonymous: boolean;
  };
  governmentDispatch?: GovernmentDispatchRecord;
  sweeperCrew?: {
    assignedTeam: string;
    sweeperNotes?: string;
    cleanedAt?: string;
    recycledKg?: number;
  };
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number; // 0.1 to 1.0 based on severity and tonnage
  id: string;
  severity: DumpSeverity;
  title: string;
  status: DumpStatus;
}

export interface AIDumpAnalysisResult {
  title: string;
  description: string;
  categories: WasteCategory[];
  severity: DumpSeverity;
  estimatedWeightKg: number;
  hazardScore: number;
  healthRisks: string[];
  recommendedEquipment: string[];
  confidence: number;
}
