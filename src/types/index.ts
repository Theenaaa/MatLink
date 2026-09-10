// ============================================================
// CORE TYPE DEFINITIONS
// AI-Driven Material Master Standardization Platform
// Domain Expert / Reviewer Module
// ============================================================

export type UserRole = 'REVIEWER' | 'DATA_MANAGER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  cpse: string;
  avatarInitials: string;
}

// ============================================================
// REVIEW STATUS
// ============================================================
export type ReviewStatus =
  | 'PENDING_REVIEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'MODIFIED'
  | 'NEW_MASTER_REQUIRED';

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MODIFIED: 'Modified',
  NEW_MASTER_REQUIRED: 'New Master Required',
};

// ============================================================
// MATCH TYPE
// ============================================================
export type MatchType = 'EXACT' | 'NEAR_DUPLICATE' | 'FUNCTIONALLY_EQUIVALENT';

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  EXACT: 'Exact',
  NEAR_DUPLICATE: 'Near-Duplicate',
  FUNCTIONALLY_EQUIVALENT: 'Functionally Equivalent',
};

// ============================================================
// CONFIDENCE BAND
// ============================================================
export type ConfidenceBand = 'HIGH' | 'MEDIUM' | 'REQUIRES_REVIEW';

export function getConfidenceBand(score: number): ConfidenceBand {
  if (score >= 90) return 'HIGH';
  if (score >= 75) return 'MEDIUM';
  return 'REQUIRES_REVIEW';
}

export const CONFIDENCE_BAND_LABELS: Record<ConfidenceBand, string> = {
  HIGH: 'High Confidence',
  MEDIUM: 'Medium Confidence',
  REQUIRES_REVIEW: 'Requires Review',
};

// ============================================================
// AI EXPLANATION ATTRIBUTES
// ============================================================
export interface ExplainabilityFactor {
  attribute: string;
  status: 'MATCH' | 'CONFLICT' | 'MISSING';
  sourceValue?: string;
  recommendedValue?: string;
  description: string;
}

// ============================================================
// AI RECOMMENDATION
// ============================================================
export interface AIRecommendation {
  masterCode: string;
  standardizedDescription: string;
  attributes: Record<string, string>;
  confidence: number;
  matchType: MatchType;
  explanation: ExplainabilityFactor[];
  conflicts: string[];
}

// ============================================================
// CANDIDATE MATCH (similar materials from other CPSEs)
// ============================================================
export interface CandidateMatch {
  materialId: string;
  cpse: string;
  description: string;
  similarity: number;
  matchingAttributes: string[];
  conflictingAttributes: ConflictingAttribute[];
  attributes: Record<string, string>;
}

export interface ConflictingAttribute {
  attribute: string;
  sourceValue: string;
  candidateValue: string;
}

// ============================================================
// AUDIT RECORD
// ============================================================
export interface AuditRecord {
  id: string;
  materialId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'APPROVE' | 'REJECT' | 'MODIFY' | 'CREATE_NEW_MASTER' | 'VIEW';
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  previousValue?: string;
  newValue?: string;
  decision?: string;
  reason?: string;
  comment?: string;
  timestamp: string;
}

// ============================================================
// MATERIAL (core entity)
// ============================================================
export interface Material {
  id: string;
  originalCode: string;
  originalDescription: string;
  sourceCPSE: string;
  category: string;
  uom: string;
  manufacturer?: string;
  originalSpecifications?: string;
  sourceDataset: string;

  // Normalized attributes (cleaned but not harmonized)
  normalizedAttributes?: Record<string, string>;

  // AI output
  aiRecommendation: AIRecommendation;

  // Candidate matches from other CPSEs
  candidateMatches: CandidateMatch[];

  // Human decision state
  reviewStatus: ReviewStatus;
  assignedReviewer?: string;
  reviewerComment?: string;
  modifiedAttributes?: Record<string, string>;
  newMasterData?: NewMasterData;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;

  // Audit trail
  auditHistory: AuditRecord[];
}

// ============================================================
// HARMONIZED MASTER RECORD
// ============================================================
export interface HarmonizedMaster {
  id: string;
  commonMaterialCode: string;
  standardizedDescription: string;
  category: string;
  uom: string;
  keyAttributes: Record<string, string>;
  sourceCPSECount: number;
  sourceCPSEs: string[];
  approvalStatus: 'APPROVED' | 'DRAFT' | 'UNDER_REVIEW';
  approvedBy: string;
  approvedAt: string;
  linkedMaterialIds: string[];
}

// ============================================================
// NEW MASTER FORM DATA
// ============================================================
export interface NewMasterData {
  commonMaterialCode: string;
  standardizedDescription: string;
  category: string;
  uom: string;
  technicalAttributes: Record<string, string>;
  standards: string;
  reasonForNew: string;
}

// ============================================================
// REVIEW QUEUE FILTERS
// ============================================================
export interface ReviewQueueFilters {
  search: string;
  confidenceBand: 'ALL' | ConfidenceBand;
  matchType: 'ALL' | MatchType;
  sourceCPSE: string;
  reviewStatus: 'ALL' | ReviewStatus;
}

// ============================================================
// REVIEW DECISION PAYLOADS
// ============================================================
export interface ApprovePayload {
  materialId: string;
  reviewerId: string;
  reviewerName: string;
  timestamp: string;
}

export interface RejectPayload {
  materialId: string;
  reason: string;
  comment?: string;
  reviewerId: string;
  reviewerName: string;
  timestamp: string;
}

export interface ModifyPayload {
  materialId: string;
  modifiedAttributes: Record<string, string>;
  standardizedDescription?: string;
  reviewerId: string;
  reviewerName: string;
  timestamp: string;
}

export interface CreateMasterPayload {
  materialId: string;
  masterData: NewMasterData;
  reviewerId: string;
  reviewerName: string;
  timestamp: string;
}

// ============================================================
// KPI SUMMARY
// ============================================================
export interface ReviewQueueKPIs {
  total: number;
  pendingReview: number;
  inReview: number;
  highConfidence: number;
  mediumConfidence: number;
  requiresReview: number;
  approvedToday: number;
  rejected: number;
}
