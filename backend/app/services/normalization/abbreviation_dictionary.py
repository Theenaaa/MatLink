"""
CANONIX Engineering Abbreviation Dictionary
Curated domain abbreviations, standard equivalents, and regex tokens for oil & gas CPSE materials.
"""

import re

# Exact token-boundary mappings (token -> expanded canonical representation)
# Uses regex word boundaries so that abbreviations like "SS" are not matched inside "PRESSURE".
EXACT_ABBREVIATIONS = {
    # Materials / Metallurgies
    r"\bCS\b": "CARBON STEEL",
    r"\bC\.S\.\b": "CARBON STEEL",
    r"\bCARBON\s+STL\b": "CARBON STEEL",
    r"\bSS\b": "STAINLESS STEEL",
    r"\bS\.S\.\b": "STAINLESS STEEL",
    r"\bSTNLS\s+STL\b": "STAINLESS STEEL",
    r"\bAS\b": "ALLOY STEEL",
    r"\bALLOY\s+STL\b": "ALLOY STEEL",
    r"\bCI\b": "CAST IRON",
    r"\bC\.I\.\b": "CAST IRON",
    r"\bDI\b": "DUCTILE IRON",
    r"\bD\.I\.\b": "DUCTILE IRON",
    r"\bMS\b": "MILD STEEL",
    r"\bM\.S\.\b": "MILD STEEL",
    r"\bDSS\b": "DUPLEX STAINLESS STEEL",

    # Construction Methods
    r"\bSMLS\b": "SEAMLESS",
    r"\bSEAMLS\b": "SEAMLESS",
    r"\bS/L\b": "SEAMLESS",
    r"\bWLD\b": "WELDED",
    r"\bWLDD\b": "WELDED",
    r"\bERW\b": "ELECTRIC RESISTANCE WELDED",
    r"\bEFW\b": "ELECTRIC FUSION WELDED",
    r"\bSAW\b": "SUBMERGED ARC WELDED",
    r"\bFRGD\b": "FORGED",

    # Schedules & Wall Thickness
    r"\bSCH\.STD\b": "STD",
    r"\bSCH\s+STD\b": "STD",
    r"\bSCH-STD\b": "STD",
    r"\bSTD\s+WT\b": "STD",
    r"\bSCH\.XS\b": "XS",
    r"\bSCH\s+XS\b": "XS",
    r"\bSCH-XS\b": "XS",
    r"\bSCH\.XXS\b": "XXS",
    r"\bSCH\s+XXS\b": "XXS",
    r"\bSCH-XXS\b": "XXS",
    r"\bSCH10\b": "SCH 10",
    r"\bSCH20\b": "SCH 20",
    r"\bSCH30\b": "SCH 30",
    r"\bSCH40\b": "SCH 40",
    r"\bSCH60\b": "SCH 60",
    r"\bSCH80\b": "SCH 80",
    r"\bSCH100\b": "SCH 100",
    r"\bSCH120\b": "SCH 120",
    r"\bSCH140\b": "SCH 140",
    r"\bSCH160\b": "SCH 160",

    # Pressure Ratings
    r"\bCL\s*150\b": "CLASS 150",
    r"\b150\s*#(?!\w)": "CLASS 150",
    r"\b150\s*LBS?\b": "CLASS 150",
    r"\bCLASS\s*150#(?!\w)": "CLASS 150",

    r"\bCL\s*300\b": "CLASS 300",
    r"\b300\s*#(?!\w)": "CLASS 300",
    r"\b300\s*LBS?\b": "CLASS 300",
    r"\bCLASS\s*300#(?!\w)": "CLASS 300",

    r"\bCL\s*600\b": "CLASS 600",
    r"\b600\s*#(?!\w)": "CLASS 600",
    r"\b600\s*LBS?\b": "CLASS 600",
    r"\bCLASS\s*600#(?!\w)": "CLASS 600",

    r"\bCL\s*800\b": "CLASS 800",
    r"\b800\s*#(?!\w)": "CLASS 800",
    r"\b800\s*LBS?\b": "CLASS 800",

    r"\bCL\s*900\b": "CLASS 900",
    r"\b900\s*#(?!\w)": "CLASS 900",
    r"\b900\s*LBS?\b": "CLASS 900",

    r"\bCL\s*1500\b": "CLASS 1500",
    r"\b1500\s*#(?!\w)": "CLASS 1500",
    r"\b1500\s*LBS?\b": "CLASS 1500",

    r"\bCL\s*2500\b": "CLASS 2500",
    r"\b2500\s*#(?!\w)": "CLASS 2500",
    r"\b2500\s*LBS?\b": "CLASS 2500",

    r"\b3000\s*#(?!\w)": "3000 LB",
    r"\b6000\s*#(?!\w)": "6000 LB",

    # Standards (ASME / API / BS / DIN)
    r"\bB-?36\.10\b": "ASME B36.10",
    r"\bASME/ANSI\s+B-?36\.10\b": "ASME B36.10",
    r"\bANSI\s+B-?36\.10\b": "ASME B36.10",
    r"\bB-?36\.19\b": "ASME B36.19",
    r"\bANSI\s+B-?36\.19\b": "ASME B36.19",
    r"\bB-?16\.5\b": "ASME B16.5",
    r"\bANSI\s+B-?16\.5\b": "ASME B16.5",
    r"\bB-?16\.9\b": "ASME B16.9",
    r"\bANSI\s+B-?16\.9\b": "ASME B16.9",
    r"\bB-?16\.11\b": "ASME B16.11",
    r"\bANSI\s+B-?16\.11\b": "ASME B16.11",
    r"\bB-?16\.20\b": "ASME B16.20",
    r"\bB-?16\.34\b": "ASME B16.34",
    r"\bAPI-?6D\b": "API 6D",
    r"\bAPI-?600\b": "API 600",
    r"\bAPI-?602\b": "API 602",
    r"\bAPI-?594\b": "API 594",
    r"\bAPI-?609\b": "API 609",
    r"\bMSS-?SP-?44\b": "MSS SP-44",

    # End Types
    r"\bB\.E\.\b": "BE",
    r"\bB/E\b": "BE",
    r"\bP\.E\.\b": "PE",
    r"\bP/E\b": "PE",
    r"\bT\.E\.\b": "THD",
    r"\bS\.W\.\b": "SW",
    r"\bFLGD\b": "FLANGED",
    r"\bR\.F\.\b": "RF",
    r"\bF\.F\.\b": "FF",
    r"\bR\.T\.J\.\b": "RTJ",
}

# Material ASTM standard prefixes
ASTM_GRADE_PATTERNS = [
    (r"\bA-?106\s*(?:GR\.?|GRADE)?\s*([ABC])\b", r"ASTM A106 GR.\1"),
    (r"\bASTM\s+A-?106\s*(?:GR\.?|GRADE)?\s*([ABC])\b", r"ASTM A106 GR.\1"),
    (r"\bA-?105(?:N)?\b", r"ASTM A105"),
    (r"\bASTM\s+A-?105(?:N)?\b", r"ASTM A105"),
    (r"\bA-?234\s*(?:GR\.?|GRADE)?\s*(WPB|WPC)\b", r"ASTM A234 \1"),
    (r"\bASTM\s+A-?234\s*(?:GR\.?|GRADE)?\s*(WPB|WPC)\b", r"ASTM A234 \1"),
    (r"\bA-?312\s*(?:TP)?\s*(304L?|316L?|321)\b", r"ASTM A312 TP\1"),
    (r"\bASTM\s+A-?312\s*(?:TP)?\s*(304L?|316L?|321)\b", r"ASTM A312 TP\1"),
    (r"\bA-?182\s*(?:F)?\s*(304L?|316L?|F11|F22|F9)\b", r"ASTM A182 F\1"),
    (r"\bASTM\s+A-?182\s*(?:F)?\s*(304L?|316L?|F11|F22|F9)\b", r"ASTM A182 F\1"),
    (r"\bA-?216\s*(?:GR\.?|GRADE)?\s*(WCB|WCC)\b", r"ASTM A216 \1"),
    (r"\bASTM\s+A-?216\s*(?:GR\.?|GRADE)?\s*(WCB|WCC)\b", r"ASTM A216 \1"),
    (r"\bA-?350\s*(?:GR\.?|GRADE)?\s*(LF2)\b", r"ASTM A350 \1"),
    (r"\bA-?333\s*(?:GR\.?|GRADE)?\s*(6)\b", r"ASTM A333 GR.6"),
    (r"\bA-?193\s*(?:GR\.?|GRADE)?\s*(B7|B8|B8M)\b", r"ASTM A193 \1"),
    (r"\bA-?194\s*(?:GR\.?|GRADE)?\s*(2H|8|8M)\b", r"ASTM A194 \1"),
]
