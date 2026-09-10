// ============================================================
// REVIEW API — TanStack Query-compatible async functions
// Uses in-memory mock store — replace with FastAPI calls later
// ============================================================

import type {
  Material,
  HarmonizedMaster,
  AuditRecord,
  ReviewQueueFilters,
  ReviewQueueKPIs,
  ApprovePayload,
  RejectPayload,
  ModifyPayload,
  CreateMasterPayload,
  ReviewStatus,
} from '@/types';
import { getConfidenceBand } from '@/types';
import {
  getAllMaterials,
  getMaterialById,
  updateMaterialStatus,
  getAllHarmonized,
  addHarmonizedRecord,
  getAuditHistory,
  addAuditRecord,
} from '@/lib/mock/store';

// Simulate async latency
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- REVIEW QUEUE -------------------------------------------------------

export async function getReviewQueue(
  filters?: Partial<ReviewQueueFilters>
): Promise<Material[]> {
  await delay(300);
  let materials = getAllMaterials();

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    materials = materials.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.originalDescription.toLowerCase().includes(q) ||
        m.sourceCPSE.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.aiRecommendation.masterCode.toLowerCase().includes(q)
    );
  }

  if (filters?.confidenceBand && filters.confidenceBand !== 'ALL') {
    materials = materials.filter(
      (m) => getConfidenceBand(m.aiRecommendation.confidence) === filters.confidenceBand
    );
  }

  if (filters?.matchType && filters.matchType !== 'ALL') {
    materials = materials.filter(
      (m) => m.aiRecommendation.matchType === filters.matchType
    );
  }

  if (filters?.sourceCPSE && filters.sourceCPSE !== 'ALL') {
    materials = materials.filter((m) => m.sourceCPSE === filters.sourceCPSE);
  }

  if (filters?.reviewStatus && filters.reviewStatus !== 'ALL') {
    materials = materials.filter((m) => m.reviewStatus === filters.reviewStatus);
  }

  return materials;
}

export async function getReviewQueueKPIs(): Promise<ReviewQueueKPIs> {
  await delay(100);
  const materials = getAllMaterials();
  const today = new Date().toDateString();

  return {
    total: materials.length,
    pendingReview: materials.filter((m) => m.reviewStatus === 'PENDING_REVIEW').length,
    inReview: materials.filter((m) => m.reviewStatus === 'IN_REVIEW').length,
    highConfidence: materials.filter(
      (m) => getConfidenceBand(m.aiRecommendation.confidence) === 'HIGH'
    ).length,
    mediumConfidence: materials.filter(
      (m) => getConfidenceBand(m.aiRecommendation.confidence) === 'MEDIUM'
    ).length,
    requiresReview: materials.filter(
      (m) => getConfidenceBand(m.aiRecommendation.confidence) === 'REQUIRES_REVIEW'
    ).length,
    approvedToday: materials.filter(
      (m) =>
        m.reviewStatus === 'APPROVED' &&
        m.reviewedAt &&
        new Date(m.reviewedAt).toDateString() === today
    ).length,
    rejected: materials.filter((m) => m.reviewStatus === 'REJECTED').length,
  };
}

export async function getUniqueCPSEs(): Promise<string[]> {
  await delay(50);
  const materials = getAllMaterials();
  return [...new Set(materials.map((m) => m.sourceCPSE))].sort();
}

// ---- SINGLE MATERIAL ----------------------------------------------------

export async function getMaterial(id: string): Promise<Material | null> {
  await delay(200);
  return getMaterialById(id) ?? null;
}

export async function getCandidateMatches(id: string) {
  await delay(150);
  const m = getMaterialById(id);
  return m?.candidateMatches ?? [];
}

// ---- DECISIONS ----------------------------------------------------------

function createAuditEntry(
  materialId: string,
  userId: string,
  userName: string,
  action: AuditRecord['action'],
  prevStatus: ReviewStatus,
  newStatus: ReviewStatus,
  extra?: Partial<AuditRecord>
): AuditRecord {
  return {
    id: `AUD-${Date.now()}`,
    materialId,
    userId,
    userName,
    userRole: 'REVIEWER',
    action,
    previousStatus: prevStatus,
    newStatus,
    timestamp: new Date().toISOString(),
    ...extra,
  };
}

export async function approveMaterial(payload: ApprovePayload): Promise<Material> {
  await delay(400);
  const material = getMaterialById(payload.materialId);
  if (!material) throw new Error('Material not found');

  const prevStatus = material.reviewStatus;
  const updated = updateMaterialStatus(payload.materialId, 'APPROVED', {
    assignedReviewer: payload.reviewerName,
    reviewerComment: `Approved by ${payload.reviewerName} at ${payload.timestamp}`,
  });
  if (!updated) throw new Error('Update failed');

  const audit = createAuditEntry(
    payload.materialId,
    payload.reviewerId,
    payload.reviewerName,
    'APPROVE',
    prevStatus,
    'APPROVED',
    {
      previousValue: prevStatus,
      newValue: material.aiRecommendation.masterCode,
      decision: `Approved — AI recommendation ${material.aiRecommendation.masterCode} accepted`,
    }
  );
  addAuditRecord(audit);

  // Add to harmonized master if not already there
  const existing = getAllHarmonized().find(
    (h) => h.commonMaterialCode === material.aiRecommendation.masterCode
  );
  if (!existing) {
    addHarmonizedRecord({
      id: `HM-${Date.now()}`,
      commonMaterialCode: material.aiRecommendation.masterCode,
      standardizedDescription: material.aiRecommendation.standardizedDescription,
      category: material.category,
      uom: material.uom,
      keyAttributes: material.aiRecommendation.attributes,
      sourceCPSECount: 1,
      sourceCPSEs: [material.sourceCPSE],
      approvalStatus: 'APPROVED',
      approvedBy: `${payload.reviewerName} (REVIEWER)`,
      approvedAt: payload.timestamp,
      linkedMaterialIds: [payload.materialId],
    });
  }

  return updated;
}

export async function rejectMaterial(payload: RejectPayload): Promise<Material> {
  await delay(400);
  const material = getMaterialById(payload.materialId);
  if (!material) throw new Error('Material not found');

  const prevStatus = material.reviewStatus;
  const updated = updateMaterialStatus(payload.materialId, 'REJECTED', {
    assignedReviewer: payload.reviewerName,
    reviewerComment: payload.comment,
  });
  if (!updated) throw new Error('Update failed');

  const audit = createAuditEntry(
    payload.materialId,
    payload.reviewerId,
    payload.reviewerName,
    'REJECT',
    prevStatus,
    'REJECTED',
    {
      reason: payload.reason,
      comment: payload.comment,
      decision: `Rejected — Reason: ${payload.reason}`,
    }
  );
  addAuditRecord(audit);
  return updated;
}

export async function modifyMaterial(payload: ModifyPayload): Promise<Material> {
  await delay(400);
  const material = getMaterialById(payload.materialId);
  if (!material) throw new Error('Material not found');

  const prevStatus = material.reviewStatus;
  const updated = updateMaterialStatus(payload.materialId, 'MODIFIED', {
    assignedReviewer: payload.reviewerName,
    modifiedAttributes: payload.modifiedAttributes,
  });
  if (!updated) throw new Error('Update failed');

  const audit = createAuditEntry(
    payload.materialId,
    payload.reviewerId,
    payload.reviewerName,
    'MODIFY',
    prevStatus,
    'MODIFIED',
    {
      previousValue: material.aiRecommendation.standardizedDescription,
      newValue: payload.modifiedAttributes?.standardizedDescription,
      comment: 'Reviewer modified AI-generated attributes',
    }
  );
  addAuditRecord(audit);
  return updated;
}

export async function createNewMaster(payload: CreateMasterPayload): Promise<Material> {
  await delay(400);
  const material = getMaterialById(payload.materialId);
  if (!material) throw new Error('Material not found');

  const prevStatus = material.reviewStatus;
  const updated = updateMaterialStatus(payload.materialId, 'NEW_MASTER_REQUIRED', {
    assignedReviewer: payload.reviewerName,
    newMasterData: payload.masterData,
  });
  if (!updated) throw new Error('Update failed');

  const audit = createAuditEntry(
    payload.materialId,
    payload.reviewerId,
    payload.reviewerName,
    'CREATE_NEW_MASTER',
    prevStatus,
    'NEW_MASTER_REQUIRED',
    {
      reason: payload.masterData.reasonForNew,
      newValue: payload.masterData.commonMaterialCode,
      decision: `New master required — ${payload.masterData.commonMaterialCode}`,
    }
  );
  addAuditRecord(audit);

  // Add new master record
  addHarmonizedRecord({
    id: `HM-NEW-${Date.now()}`,
    commonMaterialCode: payload.masterData.commonMaterialCode,
    standardizedDescription: payload.masterData.standardizedDescription,
    category: payload.masterData.category,
    uom: payload.masterData.uom,
    keyAttributes: payload.masterData.technicalAttributes,
    sourceCPSECount: 1,
    sourceCPSEs: [material.sourceCPSE],
    approvalStatus: 'DRAFT',
    approvedBy: `${payload.reviewerName} (REVIEWER)`,
    approvedAt: payload.timestamp,
    linkedMaterialIds: [payload.materialId],
  });

  return updated;
}

// ---- HARMONIZED MASTER --------------------------------------------------

export async function getHarmonizedMaster(): Promise<HarmonizedMaster[]> {
  await delay(250);
  return getAllHarmonized();
}

// ---- AUDIT HISTORY ------------------------------------------------------

export async function getAuditHistoryForMaterial(id: string): Promise<AuditRecord[]> {
  await delay(150);
  const inMaterial = getMaterialById(id)?.auditHistory ?? [];
  const inStore = getAuditHistory(id);
  // Combine, deduplicate by id
  const combined = [...inStore, ...inMaterial];
  const seen = new Set<string>();
  return combined.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
