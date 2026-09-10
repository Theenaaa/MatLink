"""
CANONIX National Material Schemas (Phase 5)
Pydantic schemas for National Material Identities, legacy mappings, and creation workflows.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class MaterialMappingItem(BaseModel):
    id: int
    national_material_id: int
    material_id: int
    material_code: str
    material_raw_description: str
    material_canonical_description: Optional[str] = None
    cpse_code: str
    cpse_name: str
    mapping_type: str
    confidence_score: float
    status: str
    notes: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class MaterialMappingCreate(BaseModel):
    material_id: int = Field(..., description="ID of the legacy CPSE material to map")
    mapping_type: str = Field("EQUIVALENT", description="PRIMARY, EQUIVALENT, NEAR_DUPLICATE, FUNCTIONALLY_EQUIVALENT, APPROVED_SUBSTITUTE")
    confidence_score: float = Field(1.0, description="Confidence score of the mapping")
    notes: Optional[str] = Field(None, description="Expert justification or notes")


class NationalMaterialListItem(BaseModel):
    id: int
    national_material_code: str
    canonical_description: str
    material_type: str
    material_group: str
    status: str
    mapped_count: int
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class NationalMaterialDetail(BaseModel):
    id: int
    national_material_code: str
    canonical_description: str
    material_type: str
    material_group: str
    material_dna: Dict[str, Any]
    status: str
    originating_match_id: Optional[int] = None
    ai_evidence: Optional[Dict[str, Any]] = None
    mappings: List[MaterialMappingItem]
    created_at: str
    approved_at: Optional[str] = None
    approved_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class NationalMaterialCreate(BaseModel):
    national_material_code: Optional[str] = Field(None, description="Optional custom code; generated as NM-XXXXXX if omitted")
    canonical_description: str = Field(..., description="Canonical standard description")
    material_type: str = Field(..., description="Standard material type (e.g. PIPE, VALVE, PUMP)")
    material_group: str = Field("GENERAL", description="Material group category")
    material_dna: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Structured technical DNA attributes")
    status: Optional[str] = Field("PENDING_APPROVAL", description="Initial status")


class NationalMaterialFromMatchRequest(BaseModel):
    national_material_code: Optional[str] = Field(None, description="Override national code if needed")
    canonical_description: Optional[str] = Field(None, description="Override canonical description if needed")
    material_type: Optional[str] = Field(None, description="Override material type if needed")
    material_group: Optional[str] = Field(None, description="Override material group if needed")
    include_candidate_mapping: bool = Field(True, description="Whether to include Material B in initial legacy mappings")
    explicit_substitute_authorization: bool = Field(False, description="Mandatory if match relationship is APPROVED_SUBSTITUTE")


class NationalMaterialListResponse(BaseModel):
    items: List[NationalMaterialListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class NationalMaterialRejectRequest(BaseModel):
    reason: str = Field(..., description="Mandatory reason for rejection")
