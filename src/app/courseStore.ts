// Shared data store — imported by MaterialReview, QuizReview, and LearningPortal.
// Mutable status maps allow runtime changes in MaterialReview/QuizReview to be
// reflected when the LearningPortal next mounts.

export type MStatus = "approved" | "pending" | "rejected";
export type BType = "paragraph" | "steps" | "table" | "warning" | "image" | "video";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface SopCourse {
  id: string; title: string; dept: string; date: string; emoji: string;
  fromColor: string; toColor: string;
}

export interface CourseModule {
  id: string; sopId: string; number: number; title: string;
}

export interface Block {
  id: string; type: BType; data: Record<string, unknown>;
}

export interface QuizOption { id: string; text: string; isCorrect: boolean; }

export interface QuizQuestion {
  id: string; questionNumber: number; questionText: string;
  difficulty: DifficultyLevel; options: QuizOption[];
}

export interface ModuleQuiz {
  id: string; moduleId: string; sopId: string;
  sopName: string; department: string; dateGenerated: string;
  questions: QuizQuestion[];
}

// ── Mutable status maps ───────────────────────────────────────────────────────
// MaterialReview and QuizReview mutate these at runtime via updateModuleStatus()
// and updateQuizStatus(). LearningPortal reads them when it mounts.

export const moduleStatus: Record<string, MStatus> = {
  m1: "approved", m2: "approved", m3: "pending",
  m4: "pending",  m5: "rejected", m6: "approved", m7: "approved",
  m8: "approved", m9: "pending",  m10: "approved",
  m11: "approved", m12: "pending",
  m13: "approved", m14: "approved", m15: "approved", m16: "approved",
};

export const quizStatus: Record<string, "approved" | "pending" | "rejected"> = {
  Q001: "approved", Q002: "approved", Q003: "pending",
  Q004: "pending",  Q005: "approved", Q006: "approved", Q007: "approved",
  Q008: "approved", Q009: "pending",  Q010: "approved",
  Q011: "approved", Q012: "pending",
  Q013: "approved", Q014: "approved", Q015: "approved", Q016: "approved",
};

export function updateModuleStatus(id: string, status: MStatus) {
  moduleStatus[id] = status;
  save();
}

export function updateQuizStatus(id: string, status: "approved" | "pending" | "rejected") {
  quizStatus[id] = status;
  save();
}

// ── SOPs ──────────────────────────────────────────────────────────────────────
export const SOPS: SopCourse[] = [
  { id: "s1", title: "AC Installation Manual",     dept: "Engineering", date: "16 May 2026", emoji: "🔧", fromColor: "#064E3B", toColor: "#022C22" },
  { id: "s2", title: "Customer Service Protocol",  dept: "Sales",       date: "17 May 2026", emoji: "🤝", fromColor: "#831843", toColor: "#500724" },
  { id: "s3", title: "Data Privacy Guidelines v2", dept: "IT",          date: "18 May 2026", emoji: "🔒", fromColor: "#1E293B", toColor: "#0F172A" },
  { id: "s4", title: "E-Hailing Delivery & Customer Pickup", dept: "Sales", date: "12 Jan 2026", emoji: "🛵", fromColor: "#7C2D12", toColor: "#431407" },
];

// ── Modules ───────────────────────────────────────────────────────────────────
export const ALL_MODULES: CourseModule[] = [
  { id: "m1",  sopId: "s1", number: 1,  title: "R32 Refrigerant Safety"          },
  { id: "m2",  sopId: "s1", number: 2,  title: "Site Selection & Mounting"        },
  { id: "m3",  sopId: "s1", number: 3,  title: "Piping Connection & Air Purging"  },
  { id: "m4",  sopId: "s1", number: 4,  title: "Electrical Wiring & Cable Specs"  },
  { id: "m5",  sopId: "s1", number: 5,  title: "Maintenance & Troubleshooting"    },
  { id: "m6",  sopId: "s1", number: 6,  title: "Remote Control Operations"        },
  { id: "m7",  sopId: "s1", number: 7,  title: "Warranty & Documentation"         },
  { id: "m8",  sopId: "s2", number: 1,  title: "Customer Communication Skills"    },
  { id: "m9",  sopId: "s2", number: 2,  title: "Complaint Handling Procedure"     },
  { id: "m10", sopId: "s2", number: 3,  title: "Customer Handover Protocol"       },
  { id: "m11", sopId: "s3", number: 1,  title: "Data Classification Framework"    },
  { id: "m12", sopId: "s3", number: 2,  title: "Encryption & Access Control"      },
  { id: "m13", sopId: "s4", number: 1,  title: "Objective, Scope & Platforms"      },
  { id: "m14", sopId: "s4", number: 2,  title: "Customer Self-Arranged Pickup"     },
  { id: "m15", sopId: "s4", number: 3,  title: "Company-Arranged Delivery"         },
  { id: "m16", sopId: "s4", number: 4,  title: "Documentation & Dispute Handling"  },
];

// ── Per-module metadata (summary, objectives, tools) ─────────────────────────
export interface ModuleMeta {
  summary: string;
  objectives: string[];
  tools: string[];
}

export const MODULE_META: Record<string, ModuleMeta> = {
  m1: {
    summary: "This module covers R32 refrigerant properties, its flammability classification, and the mandatory safety protocols every certified technician must follow when handling, recovering, or working near R32 systems.",
    objectives: [
      "State the GWP, ODP, and flammability class of R32 refrigerant",
      "Identify and eliminate ignition hazards before commencing work",
      "Select correct PPE for R32 handling tasks",
      "Recover R32 safely using certified equipment without venting",
    ],
    tools: ["Electronic Leak Detector", "R32-Certified Recovery Machine", "Safety Gloves (Class III)", "Safety Goggles", "Calibrated Manifold Gauge"],
  },
  m2: {
    summary: "Covers correct site selection criteria for both indoor and outdoor AC units, required clearances, wall-type considerations, and the safety checks required before drilling any anchor points.",
    objectives: [
      "Apply minimum clearance requirements for indoor and outdoor units",
      "Select appropriate wall anchors for concrete and plasterboard surfaces",
      "Use a pipe and cable detector correctly before drilling",
      "Ensure correct drain slope to prevent condensate back-flow",
    ],
    tools: ["Cable & Pipe Detector", "Spirit Level", "Drill with Concrete Bit", "Expansion Bolt Set", "Measuring Tape"],
  },
  m3: {
    summary: "This module teaches technicians how to correctly connect refrigerant pipes, apply the right torque for each pipe size, wrap thermal insulation, and purge air from the system using a vacuum pump. All connections for R32 refrigerant models must be made on the outdoor side only.",
    objectives: [
      "Identify correct torque values by pipe size and model",
      "Connect indoor and outdoor unit pipes without deformation",
      "Wrap and insulate all pipe joints and drain hose correctly",
      "Perform the full vacuum pump air purging sequence safely",
    ],
    tools: ["Torque Wrench", "Vacuum Pump", "Manifold Gauge", "Electronic Leak Detector", "Vinyl Tape", "Two Open-End Wrenches"],
  },
  m4: {
    summary: "All AC electrical wiring must comply with MS IEC 60364 and manufacturer specs. This module covers cable sizing, ELCB selection, earthing verification, and the lock-out/tag-out procedure required before any wiring work begins.",
    objectives: [
      "Select the correct cable size for each unit capacity and phase",
      "Install an ELCB/RCD on a dedicated circuit with ≤30 mA sensitivity",
      "Verify earthing continuity before energising the system",
      "Apply lock-out/tag-out procedure correctly at the distribution board",
    ],
    tools: ["Digital Multimeter", "ELCB/RCD Tester", "Crimping Tool", "Cable Stripper", "Lock-out/Tag-out Kit"],
  },
  m5: {
    summary: "Regular preventive maintenance is essential for system efficiency and longevity. This module covers the maintenance schedule, common fault diagnosis using error codes, and correct procedures for water leakage and refrigerant issues.",
    objectives: [
      "Execute the 6-month and annual preventive maintenance checklists",
      "Diagnose common faults using the model's error code table",
      "Identify symptoms of refrigerant leaks and take correct action",
      "Check and clear condensate drain systems without causing damage",
    ],
    tools: ["Fin Comb", "Coil Cleaner (Alkaline)", "Pressure Gauge", "Electronic Leak Detector", "Drain Cleaning Pump"],
  },
  m6: {
    summary: "Covers all remote control functions including modes, fan speeds, sleep timer, and scheduling. Technicians must be able to demonstrate all functions to customers at handover and advise on energy-efficient settings.",
    objectives: [
      "Demonstrate each operating mode: Cool, Heat, Dry, Fan, Auto",
      "Explain the energy-saving benefits of Sleep Mode and correct setpoints",
      "Configure and test the ON/OFF timer scheduling function",
      "Troubleshoot remote control pairing and IR signal issues",
    ],
    tools: ["Remote Control (unit-specific)", "IR Signal Tester", "AAA Batteries"],
  },
  m7: {
    summary: "Complete installation documentation is required for warranty validation and future service reference. Covers the Installation Completion Record, photographic evidence requirements, customer sign-off, and the online warranty registration process.",
    objectives: [
      "Complete the Installation Completion Record accurately on-site",
      "Take and organise the required photographic evidence",
      "Obtain customer sign-off on the Installation Acknowledgement Form",
      "Register product warranty online within the 14-day window",
    ],
    tools: ["Installation Completion Record (Form ICS-01)", "Camera/Mobile Phone", "Customer Acknowledgement Form (Form CAF-02)"],
  },
  m8: {
    summary: "Effective customer communication underpins every APEX service interaction. This module introduces the APEX CARE framework and teaches verbal and non-verbal communication skills for in-store, phone, and on-site settings.",
    objectives: [
      "Apply the APEX CARE framework in all customer interactions",
      "Acknowledge every customer within 30 seconds of contact",
      "Use active listening and paraphrasing to confirm understanding",
      "De-escalate tense customer situations using empathy techniques",
    ],
    tools: ["APEX CARE Reference Card"],
  },
  m9: {
    summary: "Covers the end-to-end complaint handling process: CRM logging, acknowledgement SLA targets, root cause investigation, resolution confirmation, and 3-day follow-up. Proper handling converts complainants into loyal customers.",
    objectives: [
      "Log complaints in the CRM system correctly and completely",
      "Meet all acknowledgement SLA targets per complaint type",
      "Investigate root cause before proposing a resolution",
      "Close and follow up on every complaint within the defined window",
    ],
    tools: ["CRM System (Salesforce)", "Complaint Log Template", "SLA Reference Card"],
  },
  m10: {
    summary: "A structured handover creates a positive final impression, ensures the customer understands their system, and completes all warranty documentation. Covers the Customer Handover Checklist and product registration initiation.",
    objectives: [
      "Demonstrate all remote control functions to the customer",
      "Explain the filter cleaning procedure and maintenance schedule",
      "Complete and countersign the Customer Handover Checklist",
      "Initiate warranty registration before leaving the site",
    ],
    tools: ["Customer Handover Checklist (Form CHC-03)", "Product Warranty Card"],
  },
  m11: {
    summary: "All APEX data must be classified to drive appropriate handling, storage, and access controls. Covers the four-level classification framework (Public, Internal, Confidential, Restricted) and PDPA 2010 obligations for customer personal data.",
    objectives: [
      "Apply the four-tier data classification framework correctly",
      "Identify which data is protected under PDPA 2010",
      "Select the correct storage and sharing controls per classification level",
      "Recognise and report data classification breaches",
    ],
    tools: ["APEX Data Classification Reference Guide", "PDPA Quick Reference Card"],
  },
  m12: {
    summary: "Encryption and access control are the two primary technical defences for data confidentiality. Covers password policy, device encryption, MFA, VPN usage, and the requirement to use only APEX-approved applications.",
    objectives: [
      "Create passwords that meet the 12-character, mixed-character policy",
      "Enable full-disk encryption on all work devices",
      "Configure MFA on all company accounts",
      "Identify unapproved applications and avoid using them for work data",
    ],
    tools: ["Company Password Manager", "BitLocker / FileVault", "APEX Authenticator App", "Company VPN Client"],
  },
  m13: {
    summary: "Why the e-hailing SOP exists, which platforms it covers, and who has to follow it. The controlling principle: once a product is handed to a driver the customer appointed, responsibility for that product passes to the customer — but only if the handover is documented correctly.",
    objectives: [
      "State the objective of the E-Hailing Delivery & Customer Pickup SOP",
      "Identify which third-party platforms the SOP applies to",
      "Recognise which purchases and which staff fall within scope",
      "Distinguish a customer self-arranged pickup from a company-arranged delivery",
    ],
    tools: ["WhatsApp Business", "Company E-Hailing Account", "Outlet Handover Log"],
  },
  m14: {
    summary: "The full sequence for a pickup the customer books themselves, from sending the WhatsApp acknowledgement template through verifying the driver on arrival to closing the 12-hour confirmation window.",
    objectives: [
      "Send the correct acknowledgement template and collect name and IC number",
      "Verify driver identity against the customer's app screenshot before releasing goods",
      "Capture the required photo evidence at handover",
      "Apply the 12-hour customer confirmation rule correctly",
    ],
    tools: ["WhatsApp Business", "Acknowledgement Template 1-1", "Outlet Camera / Phone"],
  },
  m15: {
    summary: "The sequence when APEX books the driver. It follows the same handover discipline as a self-arranged pickup, with extra obligations at the delivery end — proof of receipt and the customer's digital signature pulled from the company account.",
    objectives: [
      "Book via the official company account and record the Order ID",
      "Verify driver identity from the app on arrival",
      "Require proof of receipt and a digital signature at the delivery end",
      "Download and file delivery evidence from the company e-hailing account",
    ],
    tools: ["Company E-Hailing Account", "Acknowledgement Template 1-2", "WhatsApp Business"],
  },
  m16: {
    summary: "The five mandatory records for every e-hailing handover, and how they are used when a customer or payment facility claims non-receipt. Evidence is what decides a dispute — the refund position depends entirely on whether the file is complete.",
    objectives: [
      "List the five mandatory documents for an e-hailing handover",
      "File evidence so it can be retrieved during a dispute",
      "Apply the refund rule when non-receipt is claimed",
      "Explain why an incomplete evidence file shifts liability back to APEX",
    ],
    tools: ["Internal Record Folder", "WhatsApp Business", "Company E-Hailing Account"],
  },
};

// ── Module → Quiz mapping ─────────────────────────────────────────────────────
export const MODULE_QUIZ: Record<string, string> = {
  m1: "Q001", m2: "Q002",  m3: "Q003",  m4: "Q004",
  m5: "Q005", m6: "Q006",  m7: "Q007",
  m8: "Q008", m9: "Q009",  m10: "Q010",
  m11: "Q011", m12: "Q012",
  m13: "Q013", m14: "Q014", m15: "Q015", m16: "Q016",
};

// ── Block content per module (mutable — MaterialReview can update) ─────────────
export const MODULE_BLOCKS: Record<string, Block[]> = {
  m1: [
    { id: "m1b1", type: "paragraph", data: { text: "R32 (CH₂F₂) is a next-generation HFC refrigerant with zero ODP and GWP of 675 — significantly lower than R22 (1 810) and R410A (2 088). It is classified A2L (mildly flammable) by ASHRAE Standard 34, requiring specific handling and installation protocols from all certified technicians." } },
    { id: "m1b2", type: "table", data: { headers: ["Property", "Value", "Note"], rows: [["Chemical Formula", "CH₂F₂", "Difluoromethane"], ["GWP (100yr)", "675", "vs R410A: 2 088"], ["ODP", "0", "Zero ozone depletion"], ["Flammability Class", "A2L", "Mildly flammable"], ["Boiling Point", "−51.7 °C", "At 1 atm"]] } },
    { id: "m1b3", type: "warning", data: { text: "R32 is mildly flammable (A2L). Eliminate all ignition sources — open flames, electrical sparks, and hot-work — within the work area before beginning. Ventilate confined spaces thoroughly. Use only R32-certified tools and recovery equipment.", level: "danger" } },
    { id: "m1b4", type: "steps", data: { items: ["Confirm area is well-ventilated before starting work", "Identify and eliminate all ignition sources in the vicinity", "Wear PPE: safety gloves, goggles, and appropriate respirator", "Use only R32-certified manifold gauges and recovery machine", "Never discharge R32 to atmosphere — use a certified recovery cylinder"] } },
  ],
  m2: [
    { id: "m2b1", type: "paragraph", data: { text: "Correct site selection for both the indoor and outdoor units is critical for system efficiency, adequate drainage, and long-term reliability. Improper placement leads to reduced capacity, excessive noise, premature failure, and potential voiding of warranty." } },
    { id: "m2b2", type: "table", data: { headers: ["Location", "Min. Clearance", "Reason"], rows: [["Rear of outdoor unit", "15 cm", "Air intake flow"], ["Top of outdoor unit", "30 cm", "Discharge air path"], ["Side of outdoor unit", "20 cm", "Service access"], ["Above indoor unit", "5 cm", "Air circulation"], ["Below indoor unit", "10 cm", "Condensate drainage"], ["Indoor to wall", "15 cm", "Airflow & access"]] } },
    { id: "m2b3", type: "warning", data: { text: "Before drilling any mounting anchors, use a cable and pipe detector to locate hidden electrical wiring, water pipes, or gas lines inside the wall. Drilling into a live cable or pressurised pipe can cause electrocution, flooding, or a gas leak.", level: "danger" } },
    { id: "m2b4", type: "steps", data: { items: ["Identify wall type and select appropriate anchors (expansion bolts for concrete, toggle bolts for plasterboard)", "Ensure the drain hole through the wall slopes outward at ≥5° to prevent back-flow", "Keep refrigerant pipe run as short as possible — every additional metre reduces capacity", "Confirm outdoor unit is on a stable, level surface or anti-vibration mounts", "Do not orient outdoor unit discharge directly into prevailing wind"] } },
  ],
  m3: [
    { id: "m3b1", type: "paragraph", data: { text: "This module covers the correct procedures for connecting refrigerant pipes, applying torque to flare nuts, wrapping thermal insulation, and purging air using a vacuum pump. All R32 refrigerant connections must be completed on the outdoor side only." } },
    { id: "m3b2", type: "table", data: { headers: ["Pipe Side", "Pipe Size", "Torque (N·m)", "Nut Width"], rows: [["Liquid", "φ6mm (¼\")", "15 – 20", "17mm"], ["Gas", "φ9.53mm (⅜\")", "30 – 35", "22mm"], ["Gas", "φ12mm (½\")", "30 – 35", "24mm"], ["Gas", "φ16mm (⅝\")", "50 – 55", "27mm"]] } },
    { id: "m3b3", type: "warning", data: { text: "Never use compressed air or oxygen to flush the refrigerant circuit. Only Oxygen-Free Nitrogen (OFN) is permitted for pressure testing. R32 is flammable — mixing with oxygen creates a serious explosion hazard.", level: "danger" } },
    { id: "m3b4", type: "steps", data: { items: ["Flare all copper pipe ends with a calibrated flaring tool — inspect for cracks", "Apply flare nut with correct torque per table using a calibrated torque wrench", "Wrap all pipe joints and drain hose with armaflex insulation — no gaps", "Connect vacuum pump to the service port and draw vacuum to ≤100 Pa absolute", "Hold vacuum for 15 minutes — no rise indicates a leak-free system"] } },
  ],
  m4: [
    { id: "m4b1", type: "paragraph", data: { text: "All electrical wiring for AC installations must comply with local electrical regulations (MS IEC 60364) and manufacturer specifications. Incorrect wiring is the leading cause of equipment failure, fire hazards, and warranty rejection." } },
    { id: "m4b2", type: "table", data: { headers: ["Unit Capacity", "Phase", "Min. Cable Size", "ELCB Rating"], rows: [["≤ 1.5 HP", "Single", "1.5 mm²", "16 A / 30 mA"], ["2 – 2.5 HP", "Single", "2.5 mm²", "20 A / 30 mA"], ["3 – 5 HP", "Single / 3-phase", "4.0 mm²", "25 A / 30 mA"], ["> 5 HP", "3-phase", "6.0 mm²", "32 A / 30 mA"]] } },
    { id: "m4b3", type: "warning", data: { text: "An ELCB/RCD with ≤30 mA trip sensitivity MUST be installed on every dedicated AC circuit. A standard MCB, timer, or capacitor alone does NOT provide earth-fault protection. Installing without an ELCB is both illegal and dangerous.", level: "danger" } },
    { id: "m4b4", type: "steps", data: { items: ["Isolate mains supply at distribution board — apply lock-out / tag-out", "Select cable size per the table above; never undersize a cable", "Connect L, N, and Earth strictly per the terminal diagram (positions vary by model)", "Verify earthing continuity with a multimeter before energising", "Install ELCB on a dedicated circuit — do not share with other high-load appliances"] } },
  ],
  m5: [
    { id: "m5b1", type: "paragraph", data: { text: "Regular preventive maintenance preserves system efficiency, extends service life, and prevents costly breakdowns. All AC systems should receive a minimum of two maintenance visits per year — at the start of the cooling season and mid-year." } },
    { id: "m5b2", type: "table", data: { headers: ["Task", "Frequency", "Performed By"], rows: [["Clean air filter", "Monthly", "User / Technician"], ["Clean indoor coil", "6 months", "Certified Tech"], ["Inspect drain pan & hose", "6 months", "Certified Tech"], ["Check refrigerant charge", "Annually", "Certified Tech"], ["Check electrical connections", "Annually", "Certified Tech"], ["Full system commissioning", "Annually", "Certified Tech"]] } },
    { id: "m5b3", type: "warning", data: { text: "Never top up refrigerant without first locating and repairing the leak. Topping up a leaking system will not resolve the problem — the refrigerant will continue to escape, and venting R32 to atmosphere is illegal.", level: "warning" } },
    { id: "m5b4", type: "steps", data: { items: ["Error code diagnosis: refer to the service manual error code table for your model", "Low cooling output: check air filter, indoor coil, outdoor coil, refrigerant charge", "Water leakage: inspect drain pan for blockage, check drain hose slope (≥5°)", "Unusual noise: inspect fan blade for ice or debris, check compressor mounts", "Compressor not starting: check run capacitor, contactor, and supply voltage"] } },
  ],
  m6: [
    { id: "m6b1", type: "paragraph", data: { text: "The remote control communicates with the indoor unit using infrared (IR) signals at 38 kHz. Understanding all functions allows users to maximise comfort and reduce energy consumption." } },
    { id: "m6b2", type: "table", data: { headers: ["Function", "Button", "Description"], rows: [["Power", "ON/OFF", "Start or stop the unit"], ["Operating Mode", "MODE", "Cycle: Auto → Cool → Dry → Fan → Heat"], ["Temperature", "▲ / ▼", "Adjust setpoint in 1 °C steps (16–30 °C)"], ["Fan Speed", "FAN", "Auto → Low → Medium → High → Turbo"], ["Sleep Mode", "SLEEP", "Raises setpoint 1 °C/hr to save energy overnight"], ["Timer", "TIMER ON/OFF", "Schedule on or off time up to 24 hours ahead"]] } },
    { id: "m6b3", type: "steps", data: { items: ["Point remote at indoor unit within 8 m — no obstructions between remote and receiver", "Recommended setpoint: 24–26 °C for comfort and efficiency", "In Dry mode, fan speed is fixed — do not use Dry mode as a primary cooling mode", "Replace AAA batteries when display dims or operating range decreases", "Clean the remote IR lens and unit receiver with a dry cloth — grease blocks IR signal"] } },
  ],
  m7: [
    { id: "m7b1", type: "paragraph", data: { text: "Complete and accurate installation documentation protects both the customer and the installing company. It is required for warranty validation, regulatory compliance, and serves as the reference for all future service visits." } },
    { id: "m7b2", type: "steps", data: { items: ["Complete the Installation Completion Record: unit serial number, date, installer certification ID, site address", "Take photographic evidence: installation location (wide shot), piping run, electrical connections, earthing point", "Have the customer read and sign the Installation Acknowledgement Form before leaving site", "Register the product warranty online at the manufacturer portal within 14 days of installation", "Submit copies of all documentation to your company records system within 24 hours"] } },
    { id: "m7b3", type: "warning", data: { text: "Warranty claims will be rejected if: (a) the installer's certification number is missing, (b) photographic evidence is absent, or (c) registration is submitted after the 14-day window. These requirements are strictly enforced with no exceptions.", level: "warning" } },
    { id: "m7b4", type: "table", data: { headers: ["Coverage", "Period", "Condition"], rows: [["Compressor", "5 years", "Registered installation only"], ["Parts", "3 years", "All registered units"], ["Labour", "1 year", "Registered installation only"], ["Extended (Gold Plan)", "Up to 5 years", "Optional paid plan"]] } },
  ],
  m8: [
    { id: "m8b1", type: "paragraph", data: { text: "Effective customer communication is the foundation of service excellence. Every interaction — whether in-store, by phone, or on-site — shapes the customer's perception of APEX. Use the APEX CARE framework: Courteous, Attentive, Responsive, Empathetic." } },
    { id: "m8b2", type: "steps", data: { items: ["Greet the customer within 30 seconds of contact — never let them wait unacknowledged", "Use the customer's name at least twice during the interaction", "Listen actively — do not interrupt; wait for them to finish before responding", "Paraphrase their concern to confirm understanding before providing a solution", "Close every interaction by confirming the customer is satisfied and offering further assistance"] } },
    { id: "m8b3", type: "warning", data: { text: "Never argue with a customer, even if they are factually incorrect. De-escalate using empathy statements ('I understand how frustrating that must be') and offer solutions rather than excuses. Escalate to a supervisor if the situation cannot be resolved.", level: "warning" } },
  ],
  m9: [
    { id: "m9b1", type: "paragraph", data: { text: "All customer complaints must be logged, acknowledged, and resolved within defined service-level targets. A complaint handled well often results in a more loyal customer than one who never complained at all." } },
    { id: "m9b2", type: "table", data: { headers: ["Complaint Type", "Acknowledgement", "Resolution Target"], rows: [["Product defect", "Within 4 hours", "Within 3 business days"], ["Installation issue", "Within 2 hours", "Within 1 business day"], ["Billing dispute", "Within 24 hours", "Within 5 business days"], ["Service delay", "Immediately", "On current visit"]] } },
    { id: "m9b3", type: "steps", data: { items: ["Log the complaint in the CRM system immediately with full details and supporting evidence", "Send an acknowledgement SMS/email within the target window", "Investigate root cause — do not assume or guess the reason", "Offer a resolution and confirm with the customer before closing the ticket", "Follow up 3 days after resolution to confirm customer satisfaction"] } },
  ],
  m10: [
    { id: "m10b1", type: "paragraph", data: { text: "A structured handover ensures the customer understands their new system, sets expectations for maintenance, and creates a positive final impression. The handover is also when warranty documentation is signed and product registration is initiated." } },
    { id: "m10b2", type: "steps", data: { items: ["Demonstrate all remote control functions — walk the customer through each mode", "Show the customer how to clean the air filter and locate the drain tray", "Explain the warranty terms, registration process, and annual maintenance schedule", "Provide the service hotline number and advise response-time commitments", "Complete and countersign the Customer Handover Checklist — leave a copy with the customer"] } },
  ],
  m11: [
    { id: "m11b1", type: "paragraph", data: { text: "All data handled by APEX staff must be classified according to its sensitivity. Correct classification drives appropriate handling, storage, and access controls. Misclassifying data creates serious legal and reputational risk." } },
    { id: "m11b2", type: "table", data: { headers: ["Classification", "Examples", "Access", "Storage"], rows: [["Public", "Brochures, website content", "Anyone", "Any system"], ["Internal", "Policies, internal memos", "All staff", "Company systems only"], ["Confidential", "Customer data, pricing", "Need-to-know", "Encrypted, access-logged"], ["Restricted", "Financial records, HR data", "Authorised only", "Encrypted, DLP-monitored"]] } },
    { id: "m11b3", type: "warning", data: { text: "Customer personal data (name, IC, address, phone) is classified as CONFIDENTIAL minimum and is protected under PDPA 2010. Sharing, emailing, or storing this data on personal devices or unapproved systems is a serious breach that may result in criminal prosecution.", level: "danger" } },
  ],
  m12: [
    { id: "m12b1", type: "paragraph", data: { text: "Encryption and access control are the two primary technical controls that protect data confidentiality and integrity. All APEX systems must implement both layers — one without the other is insufficient protection." } },
    { id: "m12b2", type: "steps", data: { items: ["Use only APEX-approved applications to store or share customer data — no personal email or messaging apps", "Enable full-disk encryption on all laptops and mobile devices used for work (BitLocker / FileVault)", "Use strong, unique passwords: minimum 12 characters, mix of upper/lower/numbers/symbols", "Change system passwords every 90 days — use the company password manager", "Enable MFA on all company accounts — authenticator app preferred over SMS"] } },
    { id: "m12b3", type: "table", data: { headers: ["Control", "Requirement", "Responsibility"], rows: [["Password length", "≥ 12 characters", "All staff"], ["Password rotation", "Every 90 days", "All staff"], ["MFA", "All company accounts", "IT enforces"], ["Device encryption", "All work devices", "IT provisions"], ["VPN for remote access", "Mandatory off-site", "All staff"]] } },
  ],
  m13: [
    { id: "m13b1", type: "paragraph", data: { text: "This SOP exists to secure the handover of products and document it properly when delivery is arranged through an e-hailing platform, so that disputes and fraud are resolved on evidence rather than recollection. The controlling principle is simple: once the product is handed to a driver the customer appointed, the company’s responsibility for that product ends — but that protection only holds if the handover was documented the way this SOP requires." } },
    { id: "m13b2", type: "table", data: { headers: ["Element", "Coverage", "Note"], rows: [["Platforms", "Lalamove, GrabExpress and similar providers", "Not an exhaustive list — covers all third-party on-demand providers"], ["Purchases", "Retail and online", "Both are in scope"], ["Staff", "Sales staff handling handover at outlets", "Applies at every outlet"], ["Arrangement", "Customer self-arranged, or company-arranged", "Different flows — see Modules 2 and 3"]] } },
    { id: "m13b3", type: "warning", data: { text: "The SOP lists platforms as “including but not limited to”. If a customer arrives with a driver from a provider not named in the SOP, this procedure still applies in full. Never treat an unfamiliar platform as an exception.", level: "warning" } },
    { id: "m13b4", type: "steps", data: { items: ["Establish who arranged the driver — the customer, or the company", "For a customer-arranged pickup, follow the Module 2 flow", "For a company-arranged delivery, follow the Module 3 flow", "Both flows require the customer acknowledgement message before handover", "Both flows require photo evidence of the driver with the product"] } },
  ],
  m14: [
    { id: "m14b1", type: "paragraph", data: { text: "When the customer books the driver themselves, the company never controls the delivery leg. The evidence collected at the counter is therefore the only protection available, and it must be complete before the product leaves the outlet." } },
    { id: "m14b2", type: "steps", data: { items: ["Send the customer the WhatsApp acknowledgement template (Communication Guidelines 1-1)", "Customer copies the text and fills in their full name as per IC and IC number", "Customer uploads an e-hailing app screenshot showing driver name, photo, contact number and Order ID", "On arrival, verify the driver against that screenshot before releasing anything", "Take a photo of the driver with the product for the internal record", "Send the customer the confirmation message once the product has been handed over"] } },
    { id: "m14b3", type: "table", data: { headers: ["Driver detail", "Verify against", "If it does not match"], rows: [["Name", "Customer app screenshot", "Do not release the product"], ["Photo", "Customer app screenshot", "Do not release the product"], ["Contact number", "Customer app screenshot", "Contact the customer to confirm"], ["Order ID", "Customer app screenshot", "Contact the customer to confirm"]] } },
    { id: "m14b4", type: "warning", data: { text: "The customer must confirm receipt within 12 hours of the confirmation message being sent. If no confirmation arrives in that window, the delivery is treated as completed. Sending the confirmation message is therefore not optional paperwork — it starts the clock that closes the company’s liability.", level: "danger" } },
  ],
  m15: [
    { id: "m15b1", type: "paragraph", data: { text: "When the company books the driver, the outlet-side discipline is the same as a self-arranged pickup, but the company also has visibility of the delivery end through its own e-hailing account — and is expected to use it. Proof of receipt must be collected and filed." } },
    { id: "m15b2", type: "steps", data: { items: ["Send the customer the WhatsApp acknowledgement template (Communication Guidelines 1-2)", "Book the driver through the official company account — never a personal account", "Record the Order ID and driver details", "Verify driver name and photo from the app on arrival", "Take a photo of the driver with the product for the internal record", "Send the customer the confirmation message after handover", "Require the driver to photograph the customer receiving the product and capture a digital signature in the app, unless the job is drop-off only", "Download the receipt photo and signature screenshot from the company account after delivery"] } },
    { id: "m15b3", type: "table", data: { headers: ["Stage", "Self-arranged pickup", "Company-arranged delivery"], rows: [["Who books", "Customer", "Company, via official account"], ["Driver details from", "Customer screenshot", "Company e-hailing account"], ["Photo at pickup", "Required", "Required"], ["Proof at delivery", "Not available", "Photo and digital signature required"], ["12-hour confirmation", "Applies", "Applies"]] } },
    { id: "m15b4", type: "warning", data: { text: "Booking a company-arranged delivery on a personal e-hailing account breaks the evidence chain — the receipt photo and digital signature cannot be retrieved from the company account afterwards, and the delivery becomes undefendable in a dispute.", level: "danger" } },
  ],
  m16: [
    { id: "m16b1", type: "paragraph", data: { text: "Every e-hailing handover produces a file of mandatory records. When a customer or a payment facility claims non-receipt, that file is the entire defence — and the refund position turns on whether it is complete." } },
    { id: "m16b2", type: "table", data: { headers: ["Mandatory document", "Captured when", "Applies to"], rows: [["Customer filled message (name and IC)", "Before handover", "Self-arranged pickup"], ["E-hailing app screenshot with driver details", "Before handover", "Self-arranged pickup"], ["Photo of driver with product at pickup", "At handover", "Both flows"], ["Photo of customer with product at delivery", "At delivery", "Company-arranged"], ["E-hailing delivery confirmation screenshot", "After delivery", "Both flows"], ["Customer WhatsApp acknowledgement", "Within 12 hours", "Both flows"]] } },
    { id: "m16b3", type: "steps", data: { items: ["On a non-receipt claim, retrieve the customer filled message for that order", "Attach the photo evidence from pickup and, where available, delivery", "Attach the e-hailing confirmation from the company account", "Submit the complete file to the payment facility or the customer", "Escalate to management only where the evidence file is incomplete"] } },
    { id: "m16b4", type: "warning", data: { text: "The refund rule is evidence-driven: no refund is issued unless the evidence is insufficient. A missing photo or an uncollected acknowledgement is what turns a defendable handover into a refund — the paperwork is the protection, not a formality.", level: "danger" } },
  ],
};

// ── Quizzes ───────────────────────────────────────────────────────────────────
export const ALL_QUIZZES: ModuleQuiz[] = [
  {
    id: "Q001", moduleId: "m1", sopId: "s1",
    sopName: "R32 Refrigerant Safety & Handling", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q001-1", questionNumber: 1, questionText: "What is the GWP (Global Warming Potential) of R32 refrigerant?", difficulty: "Easy",
        options: [{ id: "A", text: "2 088", isCorrect: false }, { id: "B", text: "1 810", isCorrect: false }, { id: "C", text: "675", isCorrect: true }, { id: "D", text: "430", isCorrect: false }] },
      { id: "Q001-2", questionNumber: 2, questionText: "What flammability class is R32 assigned under ASHRAE Standard 34?", difficulty: "Medium",
        options: [{ id: "A", text: "A1 (non-flammable)", isCorrect: false }, { id: "B", text: "A2L (mildly flammable)", isCorrect: true }, { id: "C", text: "A2 (flammable)", isCorrect: false }, { id: "D", text: "A3 (highly flammable)", isCorrect: false }] },
      { id: "Q001-3", questionNumber: 3, questionText: "Which gas is permitted for flushing or pressure-testing R32 refrigerant circuits?", difficulty: "Hard",
        options: [{ id: "A", text: "Compressed air", isCorrect: false }, { id: "B", text: "Oxygen", isCorrect: false }, { id: "C", text: "Oxygen-Free Nitrogen (OFN)", isCorrect: true }, { id: "D", text: "Carbon dioxide", isCorrect: false }] },
      { id: "Q001-4", questionNumber: 4, questionText: "What is the ODP (Ozone Depletion Potential) of R32?", difficulty: "Easy",
        options: [{ id: "A", text: "0.05", isCorrect: false }, { id: "B", text: "0.5", isCorrect: false }, { id: "C", text: "0", isCorrect: true }, { id: "D", text: "1.0", isCorrect: false }] },
      { id: "Q001-5", questionNumber: 5, questionText: "What must be done when retiring R32 from a system?", difficulty: "Medium",
        options: [{ id: "A", text: "Release to atmosphere — it is low GWP", isCorrect: false }, { id: "B", text: "Recover into a certified recovery cylinder", isCorrect: true }, { id: "C", text: "Transfer to any available container", isCorrect: false }, { id: "D", text: "Burn off in a controlled environment", isCorrect: false }] },
    ],
  },
  {
    id: "Q002", moduleId: "m2", sopId: "s1",
    sopName: "Site Selection & Mounting", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q002-1", questionNumber: 1, questionText: "What is the minimum clearance required for outdoor unit installation?", difficulty: "Medium",
        options: [{ id: "A", text: "10 cm from wall", isCorrect: false }, { id: "B", text: "15 cm from wall", isCorrect: true }, { id: "C", text: "20 cm from wall", isCorrect: false }, { id: "D", text: "25 cm from wall", isCorrect: false }] },
      { id: "Q002-2", questionNumber: 2, questionText: "Which surface is NOT suitable for mounting the indoor unit without reinforcement?", difficulty: "Easy",
        options: [{ id: "A", text: "Concrete wall", isCorrect: false }, { id: "B", text: "Plasterboard only (without backing)", isCorrect: true }, { id: "C", text: "Brick wall", isCorrect: false }, { id: "D", text: "Reinforced drywall", isCorrect: false }] },
      { id: "Q002-3", questionNumber: 3, questionText: "What must be checked before drilling any mounting holes?", difficulty: "Hard",
        options: [{ id: "A", text: "Wall paint colour", isCorrect: false }, { id: "B", text: "Hidden pipes and electrical wiring using a detector", isCorrect: true }, { id: "C", text: "Room ambient temperature", isCorrect: false }, { id: "D", text: "Time of day", isCorrect: false }] },
    ],
  },
  {
    id: "Q003", moduleId: "m3", sopId: "s1",
    sopName: "Piping Connection & Air Purging", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q003-1", questionNumber: 1, questionText: "What is the correct torque specification for a φ6mm flare nut (liquid line)?", difficulty: "Medium",
        options: [{ id: "A", text: "10–15 N·m", isCorrect: false }, { id: "B", text: "15–20 N·m", isCorrect: true }, { id: "C", text: "30–35 N·m", isCorrect: false }, { id: "D", text: "50–55 N·m", isCorrect: false }] },
      { id: "Q003-2", questionNumber: 2, questionText: "What vacuum level must be achieved before opening refrigerant service valves?", difficulty: "Hard",
        options: [{ id: "A", text: "500 Pa absolute", isCorrect: false }, { id: "B", text: "200 Pa absolute", isCorrect: false }, { id: "C", text: "100 Pa absolute", isCorrect: true }, { id: "D", text: "50 Pa absolute", isCorrect: false }] },
      { id: "Q003-3", questionNumber: 3, questionText: "On which side must ALL R32 piping connections be made?", difficulty: "Medium",
        options: [{ id: "A", text: "Indoor side only", isCorrect: false }, { id: "B", text: "Either side", isCorrect: false }, { id: "C", text: "Outdoor side only", isCorrect: true }, { id: "D", text: "Junction box side", isCorrect: false }] },
      { id: "Q003-4", questionNumber: 4, questionText: "Which tool is essential for forming copper pipe ends before connection?", difficulty: "Easy",
        options: [{ id: "A", text: "Pipe cutter", isCorrect: false }, { id: "B", text: "Flaring tool", isCorrect: true }, { id: "C", text: "Adjustable wrench", isCorrect: false }, { id: "D", text: "Screwdriver", isCorrect: false }] },
    ],
  },
  {
    id: "Q004", moduleId: "m4", sopId: "s1",
    sopName: "Electrical Wiring & Cable Specs", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q004-1", questionNumber: 1, questionText: "What is the minimum cable size for a 3-phase unit above 5 HP?", difficulty: "Hard",
        options: [{ id: "A", text: "2.5 mm²", isCorrect: false }, { id: "B", text: "4.0 mm²", isCorrect: false }, { id: "C", text: "6.0 mm²", isCorrect: true }, { id: "D", text: "10.0 mm²", isCorrect: false }] },
      { id: "Q004-2", questionNumber: 2, questionText: "Which safety device MUST be installed to protect against earth faults on an AC circuit?", difficulty: "Easy",
        options: [{ id: "A", text: "Standard MCB (circuit breaker)", isCorrect: false }, { id: "B", text: "ELCB / RCD", isCorrect: true }, { id: "C", text: "Capacitor", isCorrect: false }, { id: "D", text: "Timer", isCorrect: false }] },
      { id: "Q004-3", questionNumber: 3, questionText: "What must be verified BEFORE energising the system after wiring?", difficulty: "Medium",
        options: [{ id: "A", text: "Cable insulation colour only", isCorrect: false }, { id: "B", text: "All wiring connections and earthing continuity", isCorrect: true }, { id: "C", text: "Unit casing colour", isCorrect: false }, { id: "D", text: "Remote control batteries", isCorrect: false }] },
      { id: "Q004-4", questionNumber: 4, questionText: "What is the maximum ELCB/RCD trip current sensitivity required?", difficulty: "Medium",
        options: [{ id: "A", text: "100 mA", isCorrect: false }, { id: "B", text: "60 mA", isCorrect: false }, { id: "C", text: "30 mA", isCorrect: true }, { id: "D", text: "10 mA", isCorrect: false }] },
      { id: "Q004-5", questionNumber: 5, questionText: "What is the correct voltage tolerance for standard single-phase AC units?", difficulty: "Medium",
        options: [{ id: "A", text: "180–200 V", isCorrect: false }, { id: "B", text: "200–240 V (±10%)", isCorrect: true }, { id: "C", text: "240–280 V", isCorrect: false }, { id: "D", text: "280–320 V", isCorrect: false }] },
    ],
  },
  {
    id: "Q005", moduleId: "m5", sopId: "s1",
    sopName: "Maintenance & Troubleshooting", department: "Technical", dateGenerated: "2026-05-15",
    questions: [
      { id: "Q005-1", questionNumber: 1, questionText: "How often should air filters be cleaned according to the SOP?", difficulty: "Easy",
        options: [{ id: "A", text: "Every week", isCorrect: false }, { id: "B", text: "Every 2 weeks or 100 hours of operation", isCorrect: true }, { id: "C", text: "Every month", isCorrect: false }, { id: "D", text: "Every 3 months", isCorrect: false }] },
      { id: "Q005-2", questionNumber: 2, questionText: "What symptom most clearly indicates a refrigerant leak?", difficulty: "Medium",
        options: [{ id: "A", text: "Loud compressor noise", isCorrect: false }, { id: "B", text: "Ice formation on pipes with reduced cooling", isCorrect: true }, { id: "C", text: "High power consumption only", isCorrect: false }, { id: "D", text: "Remote not responding", isCorrect: false }] },
      { id: "Q005-3", questionNumber: 3, questionText: "Which component should be checked first when a unit fails to start?", difficulty: "Easy",
        options: [{ id: "A", text: "Compressor winding", isCorrect: false }, { id: "B", text: "Power supply and circuit breaker", isCorrect: true }, { id: "C", text: "Indoor fan blade", isCorrect: false }, { id: "D", text: "Drain pipe blockage", isCorrect: false }] },
      { id: "Q005-4", questionNumber: 4, questionText: "What does fault code E1 typically indicate?", difficulty: "Hard",
        options: [{ id: "A", text: "Filter clogged", isCorrect: false }, { id: "B", text: "High-pressure protection triggered", isCorrect: true }, { id: "C", text: "Remote signal loss", isCorrect: false }, { id: "D", text: "Drain pump failure", isCorrect: false }] },
    ],
  },
  {
    id: "Q006", moduleId: "m6", sopId: "s1",
    sopName: "Remote Control Operations", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q006-1", questionNumber: 1, questionText: "What is the recommended temperature setpoint for comfort and energy efficiency?", difficulty: "Easy",
        options: [{ id: "A", text: "18–20 °C", isCorrect: false }, { id: "B", text: "22–23 °C", isCorrect: false }, { id: "C", text: "24–26 °C", isCorrect: true }, { id: "D", text: "28–30 °C", isCorrect: false }] },
      { id: "Q006-2", questionNumber: 2, questionText: "What does Sleep Mode do to the temperature setpoint?", difficulty: "Medium",
        options: [{ id: "A", text: "Lowers it by 1 °C per hour", isCorrect: false }, { id: "B", text: "Keeps it constant throughout the night", isCorrect: false }, { id: "C", text: "Raises it by 1 °C per hour to save energy", isCorrect: true }, { id: "D", text: "Switches to Fan Only mode after 2 hours", isCorrect: false }] },
      { id: "Q006-3", questionNumber: 3, questionText: "What is the maximum operating range of the IR remote control?", difficulty: "Easy",
        options: [{ id: "A", text: "3 m", isCorrect: false }, { id: "B", text: "5 m", isCorrect: false }, { id: "C", text: "8 m", isCorrect: true }, { id: "D", text: "15 m", isCorrect: false }] },
    ],
  },
  {
    id: "Q007", moduleId: "m7", sopId: "s1",
    sopName: "Warranty & Documentation", department: "Technical", dateGenerated: "2026-05-16",
    questions: [
      { id: "Q007-1", questionNumber: 1, questionText: "Within how many days of installation must the product warranty be registered online?", difficulty: "Easy",
        options: [{ id: "A", text: "7 days", isCorrect: false }, { id: "B", text: "14 days", isCorrect: true }, { id: "C", text: "30 days", isCorrect: false }, { id: "D", text: "60 days", isCorrect: false }] },
      { id: "Q007-2", questionNumber: 2, questionText: "What is the standard compressor warranty period for registered installations?", difficulty: "Medium",
        options: [{ id: "A", text: "1 year", isCorrect: false }, { id: "B", text: "3 years", isCorrect: false }, { id: "C", text: "5 years", isCorrect: true }, { id: "D", text: "10 years", isCorrect: false }] },
      { id: "Q007-3", questionNumber: 3, questionText: "Which document must the customer sign before the technician leaves site?", difficulty: "Medium",
        options: [{ id: "A", text: "Insurance waiver", isCorrect: false }, { id: "B", text: "Installation Acknowledgement Form", isCorrect: true }, { id: "C", text: "ELCB test certificate", isCorrect: false }, { id: "D", text: "Manufacturer warranty card only", isCorrect: false }] },
    ],
  },
  {
    id: "Q008", moduleId: "m8", sopId: "s2",
    sopName: "Customer Communication Skills", department: "Sales", dateGenerated: "2026-05-17",
    questions: [
      { id: "Q008-1", questionNumber: 1, questionText: "What is the maximum time a customer should wait before being acknowledged?", difficulty: "Easy",
        options: [{ id: "A", text: "30 seconds", isCorrect: true }, { id: "B", text: "1 minute", isCorrect: false }, { id: "C", text: "2 minutes", isCorrect: false }, { id: "D", text: "5 minutes", isCorrect: false }] },
      { id: "Q008-2", questionNumber: 2, questionText: "What does the 'E' in the APEX CARE framework stand for?", difficulty: "Medium",
        options: [{ id: "A", text: "Efficient", isCorrect: false }, { id: "B", text: "Empathetic", isCorrect: true }, { id: "C", text: "Excellent", isCorrect: false }, { id: "D", text: "Energetic", isCorrect: false }] },
      { id: "Q008-3", questionNumber: 3, questionText: "When should a customer service issue be escalated to a supervisor?", difficulty: "Hard",
        options: [{ id: "A", text: "Whenever the customer raises their voice", isCorrect: false }, { id: "B", text: "When the situation cannot be resolved at the representative level", isCorrect: true }, { id: "C", text: "After 5 minutes of conversation", isCorrect: false }, { id: "D", text: "Only when requested by the customer", isCorrect: false }] },
    ],
  },
  {
    id: "Q011", moduleId: "m11", sopId: "s3",
    sopName: "Data Classification Framework", department: "IT", dateGenerated: "2026-05-18",
    questions: [
      { id: "Q011-1", questionNumber: 1, questionText: "What is the minimum data classification level for customer personal data (name, IC, address)?", difficulty: "Medium",
        options: [{ id: "A", text: "Public", isCorrect: false }, { id: "B", text: "Internal", isCorrect: false }, { id: "C", text: "Confidential", isCorrect: true }, { id: "D", text: "Restricted", isCorrect: false }] },
      { id: "Q011-2", questionNumber: 2, questionText: "Which legislation protects customer personal data in Malaysia?", difficulty: "Easy",
        options: [{ id: "A", text: "GDPR 2016", isCorrect: false }, { id: "B", text: "PDPA 2010", isCorrect: true }, { id: "C", text: "CCPA 2018", isCorrect: false }, { id: "D", text: "ISO 27001", isCorrect: false }] },
      { id: "Q011-3", questionNumber: 3, questionText: "Which of the following is classified as RESTRICTED data?", difficulty: "Hard",
        options: [{ id: "A", text: "Company brochures", isCorrect: false }, { id: "B", text: "Internal meeting minutes", isCorrect: false }, { id: "C", text: "HR staff salary records", isCorrect: true }, { id: "D", text: "Published pricing lists", isCorrect: false }] },
    ],
  },
  {
    id: "Q013", moduleId: "m13", sopId: "s4",
    sopName: "Objective, Scope & Platforms", department: "Sales", dateGenerated: "2026-01-12",
    questions: [
      { id: "Q013-1", questionNumber: 1, questionText: "What is the stated objective of the E-Hailing Delivery & Customer Pickup SOP?", difficulty: "Easy",
        options: [{ id: "A", text: "To reduce delivery costs across outlets", isCorrect: false }, { id: "B", text: "To secure product handover and document it, minimising disputes and fraud", isCorrect: true }, { id: "C", text: "To select a single preferred delivery partner", isCorrect: false }, { id: "D", text: "To speed up delivery times for online orders", isCorrect: false }] },
      { id: "Q013-2", questionNumber: 2, questionText: "A customer arrives with a driver from a platform not named in the SOP. What applies?", difficulty: "Hard",
        options: [{ id: "A", text: "The SOP does not apply — release the product normally", isCorrect: false }, { id: "B", text: "The SOP applies in full — the platform list is not exhaustive", isCorrect: true }, { id: "C", text: "Refuse the handover until the platform is added to the SOP", isCorrect: false }, { id: "D", text: "Apply only the photo requirement", isCorrect: false }] },
      { id: "Q013-3", questionNumber: 3, questionText: "Which purchases fall within the scope of this SOP?", difficulty: "Easy",
        options: [{ id: "A", text: "Online purchases only", isCorrect: false }, { id: "B", text: "Retail purchases only", isCorrect: false }, { id: "C", text: "Both retail and online purchases requiring delivery or e-hailing pickup", isCorrect: true }, { id: "D", text: "Only purchases above a set value", isCorrect: false }] },
      { id: "Q013-4", questionNumber: 4, questionText: "Under the SOP, when does the company’s responsibility for the product end?", difficulty: "Medium",
        options: [{ id: "A", text: "When the customer pays", isCorrect: false }, { id: "B", text: "When the product is handed to the driver the customer appointed", isCorrect: true }, { id: "C", text: "When the product leaves the outlet car park", isCorrect: false }, { id: "D", text: "Seven days after the sale", isCorrect: false }] },
      { id: "Q013-5", questionNumber: 5, questionText: "Which two arrangements does the SOP define separate process flows for?", difficulty: "Medium",
        options: [{ id: "A", text: "Same-day and next-day delivery", isCorrect: false }, { id: "B", text: "Customer self-arranged pickup and company-arranged delivery", isCorrect: true }, { id: "C", text: "In-store collection and postal delivery", isCorrect: false }, { id: "D", text: "Prepaid and cash-on-delivery orders", isCorrect: false }] },
    ],
  },
  {
    id: "Q014", moduleId: "m14", sopId: "s4",
    sopName: "Customer Self-Arranged Pickup", department: "Sales", dateGenerated: "2026-01-12",
    questions: [
      { id: "Q014-1", questionNumber: 1, questionText: "For a self-arranged pickup, what must the customer provide before handover?", difficulty: "Easy",
        options: [{ id: "A", text: "A verbal confirmation only", isCorrect: false }, { id: "B", text: "Name as per IC, IC number, and an app screenshot of driver details", isCorrect: true }, { id: "C", text: "A copy of the receipt", isCorrect: false }, { id: "D", text: "The driver’s vehicle registration number only", isCorrect: false }] },
      { id: "Q014-2", questionNumber: 2, questionText: "Which driver details must the app screenshot show?", difficulty: "Medium",
        options: [{ id: "A", text: "Name and photo only", isCorrect: false }, { id: "B", text: "Name, photo, contact number and Order ID", isCorrect: true }, { id: "C", text: "Order ID only", isCorrect: false }, { id: "D", text: "Contact number and vehicle model", isCorrect: false }] },
      { id: "Q014-3", questionNumber: 3, questionText: "The driver’s name and photo do not match the customer’s screenshot. What must staff do?", difficulty: "Hard",
        options: [{ id: "A", text: "Release the product — the customer booked it", isCorrect: false }, { id: "B", text: "Do not release the product", isCorrect: true }, { id: "C", text: "Release it but note the discrepancy", isCorrect: false }, { id: "D", text: "Ask the driver for a signature and proceed", isCorrect: false }] },
      { id: "Q014-4", questionNumber: 4, questionText: "Within what period must the customer confirm receipt?", difficulty: "Easy",
        options: [{ id: "A", text: "2 hours", isCorrect: false }, { id: "B", text: "12 hours", isCorrect: true }, { id: "C", text: "24 hours", isCorrect: false }, { id: "D", text: "48 hours", isCorrect: false }] },
      { id: "Q014-5", questionNumber: 5, questionText: "No confirmation is received from the customer within the stated window. What is the outcome?", difficulty: "Medium",
        options: [{ id: "A", text: "The delivery is considered completed", isCorrect: true }, { id: "B", text: "The delivery is cancelled and a refund is issued", isCorrect: false }, { id: "C", text: "The case is escalated to the payment facility", isCorrect: false }, { id: "D", text: "The window extends automatically by another 12 hours", isCorrect: false }] },
    ],
  },
  {
    id: "Q015", moduleId: "m15", sopId: "s4",
    sopName: "Company-Arranged Delivery", department: "Sales", dateGenerated: "2026-01-12",
    questions: [
      { id: "Q015-1", questionNumber: 1, questionText: "How must a company-arranged e-hailing delivery be booked?", difficulty: "Easy",
        options: [{ id: "A", text: "On any available staff account", isCorrect: false }, { id: "B", text: "Through the official company account", isCorrect: true }, { id: "C", text: "By the customer, then reimbursed", isCorrect: false }, { id: "D", text: "By phone with the platform’s call centre", isCorrect: false }] },
      { id: "Q015-2", questionNumber: 2, questionText: "What must the driver obtain at the delivery end, unless the job is drop-off only?", difficulty: "Medium",
        options: [{ id: "A", text: "A cash payment receipt", isCorrect: false }, { id: "B", text: "A photo of the customer receiving the product and a digital signature", isCorrect: true }, { id: "C", text: "The customer’s IC number", isCorrect: false }, { id: "D", text: "A second photo of the product only", isCorrect: false }] },
      { id: "Q015-3", questionNumber: 3, questionText: "What must sales staff retrieve from the company account after delivery?", difficulty: "Medium",
        options: [{ id: "A", text: "Nothing — the platform retains the records", isCorrect: false }, { id: "B", text: "The receipt photo and the digital signature screenshot", isCorrect: true }, { id: "C", text: "The driver’s rating", isCorrect: false }, { id: "D", text: "The route map", isCorrect: false }] },
      { id: "Q015-4", questionNumber: 4, questionText: "Why is booking on a personal e-hailing account a problem?", difficulty: "Hard",
        options: [{ id: "A", text: "It costs the company more", isCorrect: false }, { id: "B", text: "Delivery evidence cannot be retrieved from the company account, breaking the evidence chain", isCorrect: true }, { id: "C", text: "The platform charges a penalty fee", isCorrect: false }, { id: "D", text: "It delays the driver assignment", isCorrect: false }] },
      { id: "Q015-5", questionNumber: 5, questionText: "Which requirement applies to BOTH self-arranged pickup and company-arranged delivery?", difficulty: "Medium",
        options: [{ id: "A", text: "A photo of the customer receiving the product", isCorrect: false }, { id: "B", text: "A photo of the driver with the product at pickup", isCorrect: true }, { id: "C", text: "A digital signature captured in the app", isCorrect: false }, { id: "D", text: "Booking through the company account", isCorrect: false }] },
    ],
  },
  {
    id: "Q016", moduleId: "m16", sopId: "s4",
    sopName: "Documentation & Dispute Handling", department: "Sales", dateGenerated: "2026-01-12",
    questions: [
      { id: "Q016-1", questionNumber: 1, questionText: "A customer claims non-receipt. What must be provided?", difficulty: "Easy",
        options: [{ id: "A", text: "A verbal account from the sales staff involved", isCorrect: false }, { id: "B", text: "The customer filled message, photo evidence and e-hailing confirmation", isCorrect: true }, { id: "C", text: "The outlet CCTV footage only", isCorrect: false }, { id: "D", text: "The driver’s contact number", isCorrect: false }] },
      { id: "Q016-2", questionNumber: 2, questionText: "Under the SOP, when is a refund issued on a non-receipt claim?", difficulty: "Hard",
        options: [{ id: "A", text: "Whenever the customer requests one", isCorrect: false }, { id: "B", text: "Only where the evidence is insufficient", isCorrect: true }, { id: "C", text: "Automatically after 12 hours", isCorrect: false }, { id: "D", text: "Only with approval from the e-hailing platform", isCorrect: false }] },
      { id: "Q016-3", questionNumber: 3, questionText: "Which document is required for a self-arranged pickup but not produced in a company-arranged delivery?", difficulty: "Medium",
        options: [{ id: "A", text: "Photo of the driver with the product", isCorrect: false }, { id: "B", text: "The customer’s e-hailing app screenshot of driver details", isCorrect: true }, { id: "C", text: "The delivery confirmation screenshot", isCorrect: false }, { id: "D", text: "The WhatsApp acknowledgement", isCorrect: false }] },
      { id: "Q016-4", questionNumber: 4, questionText: "Photo evidence is required at which point(s) of the handover?", difficulty: "Medium",
        options: [{ id: "A", text: "At pickup only", isCorrect: false }, { id: "B", text: "At delivery only", isCorrect: false }, { id: "C", text: "Driver with product at pickup, and customer with product at delivery", isCorrect: true }, { id: "D", text: "Photo evidence is optional if the customer acknowledges", isCorrect: false }] },
      { id: "Q016-5", questionNumber: 5, questionText: "What is the practical consequence of an incomplete evidence file?", difficulty: "Hard",
        options: [{ id: "A", text: "The claim is automatically rejected", isCorrect: false }, { id: "B", text: "Liability shifts back to the company and a refund becomes payable", isCorrect: true }, { id: "C", text: "The driver is held responsible", isCorrect: false }, { id: "D", text: "The customer must supply the missing evidence", isCorrect: false }] },
    ],
  },
];

// ── Persistence ───────────────────────────────────────────────────────────────
// The review screens mutate the status maps above; persist them under one
// versioned key so approvals survive a refresh on the deployed prototype.
const STORAGE_KEY = "apex-course-store-v1";
export const COURSE_STORE_VERSION = 1;

const SEED_MODULE_STATUS = { ...moduleStatus };
const SEED_QUIZ_STATUS = { ...quizStatus };

function save() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: COURSE_STORE_VERSION, moduleStatus, quizStatus }),
    );
  } catch {
    // Private mode or quota exceeded — the prototype still works in memory.
  }
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      version?: number;
      moduleStatus?: Record<string, MStatus>;
      quizStatus?: Record<string, "approved" | "pending" | "rejected">;
    };
    if (parsed.version !== COURSE_STORE_VERSION) return;
    // Only known ids are restored, so a renamed seed never resurrects a stale key.
    Object.keys(moduleStatus).forEach(id => {
      const v = parsed.moduleStatus?.[id];
      if (v) moduleStatus[id] = v;
    });
    Object.keys(quizStatus).forEach(id => {
      const v = parsed.quizStatus?.[id];
      if (v) quizStatus[id] = v;
    });
  } catch {
    // Corrupt snapshot — fall through to the seed data.
  }
}

/** Restores the seed review statuses and clears the saved snapshot. */
export function resetCourseData() {
  Object.assign(moduleStatus, SEED_MODULE_STATUS);
  Object.assign(quizStatus, SEED_QUIZ_STATUS);
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing stored */ }
}

hydrate();
