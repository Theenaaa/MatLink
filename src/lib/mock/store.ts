// ============================================================
// IN-MEMORY MOCK STORE
// Mutable state store — simulates backend state for the demo
// All mutations update this store and reflect in queries
// ============================================================

import type {
  Material,
  HarmonizedMaster,
  AuditRecord,
  ReviewStatus,
} from '@/types';
import { MOCK_MATERIALS_DATA } from './materials';
import { MOCK_HARMONIZED_DATA } from './harmonized';

// Mutable copies
let materialsStore: Material[] = MOCK_MATERIALS_DATA.map((m) => ({ ...m }));
let harmonizedStore: HarmonizedMaster[] = MOCK_HARMONIZED_DATA.map((h) => ({
  ...h,
}));
let auditStore: AuditRecord[] = [];

// ---- Materials -------------------------------------------------------

export function getAllMaterials(): Material[] {
  return materialsStore;
}

export function getMaterialById(id: string): Material | undefined {
  return materialsStore.find((m) => m.id === id);
}

export function updateMaterialStatus(
  id: string,
  status: ReviewStatus,
  extra?: Partial<Material>
): Material | undefined {
  const idx = materialsStore.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  materialsStore[idx] = {
    ...materialsStore[idx],
    reviewStatus: status,
    updatedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    ...extra,
  };
  return materialsStore[idx];
}

// ---- Harmonized Master -----------------------------------------------

export function getAllHarmonized(): HarmonizedMaster[] {
  return harmonizedStore;
}

export function addHarmonizedRecord(record: HarmonizedMaster): void {
  harmonizedStore.push(record);
}

export function updateHarmonizedRecord(
  code: string,
  updates: Partial<HarmonizedMaster>
): void {
  const idx = harmonizedStore.findIndex(
    (h) => h.commonMaterialCode === code
  );
  if (idx !== -1) {
    harmonizedStore[idx] = { ...harmonizedStore[idx], ...updates };
  }
}

// ---- Audit -----------------------------------------------------------

export function getAuditHistory(materialId: string): AuditRecord[] {
  return auditStore.filter((a) => a.materialId === materialId);
}

export function getAllAuditRecords(): AuditRecord[] {
  return auditStore;
}

export function addAuditRecord(record: AuditRecord): void {
  auditStore.unshift(record);
}
