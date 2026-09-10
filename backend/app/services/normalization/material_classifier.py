"""
CANONIX Material Classifier
Rule-based classification of material type and material group.
Operates exclusively on description tokens and technical attributes.
NEVER uses material code prefixes.
"""

import re
from typing import Tuple

# Category rules with regex patterns and mapped group
# Ordered by specificity (e.g. specialized fittings before generic words)
CLASSIFICATION_RULES = [
    # Gaskets & Sealing
    (r"\b(?:SPIRAL\s+WOUND\s+)?GASKET\b|\bO[- ]?RING\b|\bPACKING\s+SEAL\b", "GASKET", "SEALING"),

    # Valves
    (r"\b(?:BALL|GATE|GLOBE|CHECK|BUTTERFLY|PLUG|NEEDLE|RELIEF|SAFETY|DIAPHRAGM|CONTROL)\s+VALVE\b|\bVALVE\b|\bVLV\b", "VALVE", "VALVES"),

    # Flanges
    (r"\b(?:WELD\s*NECK|SLIP\s*ON|BLIND|SOCKET\s*WELD|THREADED|LAP\s*JOINT)?\s*FLANGE\b|\bFLG\b", "FLANGE", "FLANGES"),

    # Piping Fittings: Elbow, Tee, Reducer, Cap, Coupling, Union
    (r"\bELBOW\b|\b90\s*DEG\s*ELB\b|\b45\s*DEG\s*ELB\b|\bBEND\b", "ELBOW", "PIPING_FITTINGS"),
    (r"\b(?:EQUAL\s+|REDUCING\s+)?TEE\b", "TEE", "PIPING_FITTINGS"),
    (r"\b(?:CONC(?:ENTRIC)?|ECC(?:ENTRIC)?)\s+REDUCER\b|\bREDUCER\b", "REDUCER", "PIPING_FITTINGS"),
    (r"\bPIPE\s*CAP\b|\bEND\s*CAP\b", "CAP", "PIPING_FITTINGS"),
    (r"\bCOUPLING\b|\bHALF\s+COUPLING\b|\bFULL\s+COUPLING\b", "COUPLING", "PIPING_FITTINGS"),
    (r"\bUNION\b", "UNION", "PIPING_FITTINGS"),
    (r"\bNIPPLE\b|\bSWAGE\s*NIPPLE\b", "NIPPLE", "PIPING_FITTINGS"),

    # Pipe & Tubing
    (r"\bPIPE\b|\bPIPING\b|\bTUBING\b|\bTUBE\b|\bCASING\b", "PIPE", "PIPING"),

    # Fasteners: Stud, Bolt, Nut, Washer, Screw
    (r"\bSTUD\s*BOLT\b|\bSTUD\b", "STUD", "FASTENERS"),
    (r"\b(?:HEX\s+|MACHINE\s+|ANCHOR\s+|EYE\s+)?BOLT\b", "BOLT", "FASTENERS"),
    (r"\b(?:HEX\s+|HEAVY\s+HEX\s+|LOCK\s+)?NUT\b", "NUT", "FASTENERS"),
    (r"\b(?:SPRING\s+|FLAT\s+)?WASHER\b", "WASHER", "FASTENERS"),
    (r"\bSCREW\b|\bSET\s*SCREW\b", "SCREW", "FASTENERS"),

    # Rotating Equipment & Mechanical Components
    (r"\b(?:CENTRIFUGAL\s+|RECIPROCATING\s+|GEAR\s+|SUBMERSIBLE\s+|DOSING\s+)?PUMP\b", "PUMP", "ROTATING_EQUIPMENT"),
    (r"\b(?:INDUCTION\s+|ELECTRIC\s+|SYNCHRONOUS\s+)?MOTOR\b", "MOTOR", "ELECTRICAL"),
    (r"\b(?:BALL\s+|ROLLER\s+|TAPER\s+|THRUST\s+)?BEARING\b", "BEARING", "MECHANICAL"),
    (r"\bCOMPRESSOR\b", "COMPRESSOR", "ROTATING_EQUIPMENT"),
    (r"\bTURBINE\b", "TURBINE", "ROTATING_EQUIPMENT"),
    (r"\bGEARBOX\b|\bGEAR\s*BOX\b", "GEARBOX", "MECHANICAL"),

    # Electrical & Instrumentation
    (r"\b(?:POWER\s+|CONTROL\s+|INSTRUMENTATION\s+|ARMOURED\s+)?CABLE\b", "CABLE", "ELECTRICAL"),
    (r"\bTRANSMITTER\b|\bPRESSURE\s+TRANSMITTER\b|\bFLOW\s+TRANSMITTER\b", "TRANSMITTER", "INSTRUMENTATION"),
    (r"\bGAUGE\b|\bPRESSURE\s+GAUGE\b|\bTEMP(?:ERATURE)?\s+GAUGE\b", "GAUGE", "INSTRUMENTATION"),
    (r"\bSWITCHGEAR\b|\bCIRCUIT\s*BREAKER\b|\bMCB\b|\bMCCB\b", "SWITCHGEAR", "ELECTRICAL"),
]


def classify_material(normalized_text: str) -> Tuple[str, str, float]:
    """
    Classifies material_type and material_group from description tokens.
    Returns: (material_type, material_group, confidence_score)
    NEVER inspects material_code.
    """
    if not normalized_text:
        return ("OTHER", "GENERAL", 0.0)

    text_upper = normalized_text.upper()

    for pattern, mat_type, mat_group in CLASSIFICATION_RULES:
        if re.search(pattern, text_upper):
            return (mat_type, mat_group, 0.98)

    return ("OTHER", "GENERAL", 0.30)
