Refine the MaterialReview screen. The current 3-panel layout 
(list | cramped content | actions) makes the material hard to 
read. Change it to a 2-state layout:

STATE A — LIST VIEW (default, what trainer sees first)
STATE B — FULL MATERIAL VIEW (when trainer clicks a module to review)

════════════════════════════════════════════════════════════
STATE A — LIST VIEW (default)
════════════════════════════════════════════════════════════

Keep the existing 3-panel skeleton but simplify it:

LEFT PANEL (240px, white, border-right) — GROUPED MODULE LIST

Replace the flat SOP list with a grouped structure:

Parent header row (not clickable):
- Background #F9FAFB, padding 12px 16px, border-bottom 1px #F3F4F6
- FileText icon (#9CA3AF) + "Installation-Manual.pdf" 12px bold #1A1F2E
- "5 modules generated" 11px #9CA3AF below

Below: 5 module rows indented (padding-left 20px), with a thin 
vertical connector line on the left (2px solid #E5E7EB) linking 
them visually to the parent:

Module 1: "R32 Refrigerant Safety"
  Technical · v1.0 · Approved · AI Score: 88%

Module 2: "Site Selection & Mounting"  
  Technical · v1.0 · Approved · AI Score: 95%

Module 3: "Piping Connection & Air Purging"
  Technical · v1.0 · Pending · AI Score: 91%
  ← ACTIVE (teal left border 3px, #E8FAF7 background)

Module 4: "Electrical Wiring & Cable Specs"
  Technical · v1.0 · Pending · AI Score: 84%

Module 5: "Maintenance & Troubleshooting"
  Technical · v1.0 · Rejected · AI Score: 62%

Keep existing status pill colors and active state styling.

CENTER PANEL (flex-1, #F4F6F9 background)

Replace the current cramped content card with a clean PREVIEW card:

Page title row:
- "Piping Connection & Air Purging" 20px bold #1A1F2E
- AI Score badge: ★ "AI Score: 91%" teal right-aligned
- Meta row: [Technical] [v1.0] · Generated 16 May 2026 · [Pending pill]

One white preview card (shadow 0 1px 4px rgba(0,0,0,0.08), rounded-lg):

Inside: show only the AI Summary and a content outline — 
this is the PREVIEW, not the full content:

  AI Summary (teal left border callout, same style as before):
  "This module covers pipe connection torque specifications, 
  thermal insulation wrapping, and the full vacuum pump air 
  purging sequence for split-type air conditioners using R32 
  refrigerant. All connections must be on the outdoor side."

  Content Outline (label: "Module Contents" 13px bold #1A1F2E, 
  then 7 section rows, each row: grey pill number + section name):
  [1] What You Will Learn
  [2] Tools & Materials Required
  [3] Torque Reference Table
  [4] Step-by-Step Piping Procedure (7 steps)
  [5] Vacuum Pump Air Purging Procedure
  [6] Critical Safety Rules
  [7] Key Terms

  Below outline: full-width teal button:
  "📄 Open Full Material Review →"
  (solid teal #00C9A7, white text, 13px bold, rounded-lg, padding 12px)
  Clicking this enters STATE B.

Review History card below (keep exactly as-is from original):
  ✓ AI Generated · Processed on 2026-05-16
  ⏳ Pending Trainer Review · Awaiting approval

RIGHT PANEL (220px, white, border-left) — REVIEW ACTIONS
Keep exactly as-is: Approve button, Reject button, 
rejection textarea, current status pill. No changes.

════════════════════════════════════════════════════════════
STATE B — FULL MATERIAL VIEW (opens when "Open Full Material Review" clicked)
════════════════════════════════════════════════════════════

This replaces the entire screen content (left, center, right panels 
all hidden). Show a full-width, full-height document view:

TOP ACTION BAR (white, sticky, height 56px, border-bottom 1px #F3F4F6,
padding 0 24px, flex row):
- Left: "← Back to List" link (13px #9CA3AF, arrow icon, 
  clicking returns to STATE A)
- Centre: "Piping Connection & Air Purging" 14px bold #1A1F2E 
  + [Pending] status pill
- Right: two action buttons side by side:
    "✗ Reject" — outlined red border, red text, 13px, rounded-lg, 
                  padding 8px 20px
    "✓ Approve" — solid teal #00C9A7, white text, 13px bold, 
                  rounded-lg, padding 8px 20px

CONTENT AREA (scrollable, background #F4F6F9, padding 32px,
max-width 860px, centred):

One large white card (rounded-lg, shadow, padding 40px):

── MODULE HEADER ──────────────────────────────────────────
Breadcrumb: "Installation-Manual.pdf  ›  Module 3 of 5" 
12px #9CA3AF, margin-bottom 12px

Title: "Piping Connection & Air Purging" 
26px bold #1A1F2E, margin-bottom 6px

Meta row: [Technical pill teal] · v1.0 · 
clock icon + "12 min read" · star icon + "AI Score: 91%"
all 12px #9CA3AF

Thin divider line (#F3F4F6), margin 20px 0

── SECTION 1 — AI Summary ─────────────────────────────────
Background #F0FDF9, border-left 3px solid #00C9A7, 
rounded-lg, padding 14px 16px, margin-bottom 28px

Sparkle icon (#00C9A7) + "AI-Generated Summary" 
11px bold #00C9A7 uppercase, margin-bottom 6px

Body 13px #374151 line-height 1.7:
"This module teaches technicians how to correctly connect 
refrigerant pipes, apply the right torque for each pipe size, 
wrap thermal insulation, and purge air from the system using 
a vacuum pump. Technicians must achieve 100Pa absolute vacuum 
before opening any refrigerant valves. All connections for 
R32 refrigerant models must be done on the outdoor side only."

── SECTION 2 — What You Will Learn ────────────────────────
"What You Will Learn" 16px bold #1A1F2E, margin-bottom 12px

4 objective cards in 2×2 grid:
(white bg, border 1px #E5E7EB, rounded-lg, padding 10px 14px,
teal checkmark icon left, 13px #374151 text)

✓ Identify correct torque values by pipe size and model
✓ Connect indoor and outdoor unit pipes without deformation
✓ Wrap and insulate pipes and drain hose correctly
✓ Perform the full vacuum pump air purging sequence safely

── SECTION 3 — Tools & Materials ──────────────────────────
"Tools & Materials Required" 16px bold #1A1F2E

Horizontal wrapping chip row:
(chips: #F3F4F6 bg, #374151 text, 11px, rounded-full, 
padding 4px 12px, gap 8px, flex-wrap)

[Torque Wrench] [Vacuum Pump] [Manifold Gauge]
[Electronic Leak Detector] [Liquid Soap Solution] 
[Vinyl Tape] [Polythene Foam ≥6mm] [Two Open-End Wrenches]

── SECTION 4 — Torque Reference Table ─────────────────────
"Pipe Connection Torque Reference" 16px bold #1A1F2E
"Always verify against your specific model before connecting"
12px italic #9CA3AF, margin-bottom 12px

Full-width table, clean style:
Header row: bg #F9FAFB, 10px bold #9CA3AF uppercase
Body rows: alternating white / #FAFAFA, 12px #374151
All cells padding 10px 14px, border-bottom 1px #F3F4F6

| Pipe Side   | Pipe Size               | Torque (N·m) | Nut Width |
|-------------|-------------------------|--------------|-----------|
| Liquid Side | φ6mm (1/4 inch)         | 15 – 20      | 17mm      |
| Gas Side    | φ9.53mm (3/8 inch)      | 30 – 35      | 22mm      |
| Gas Side    | φ12mm (1/2 inch)        | 30 – 35      | 24mm      |
| Gas Side    | φ16mm (5/8 inch)        | 50 – 55      | 27mm      |
| Gas Side    | φ19mm (3/4 inch)        | 70 – 75      | 32mm      |

Liquid Side row (15–20 N·m): highlight with #E8FAF7 background

── SECTION 5 — Step-by-Step Procedure ─────────────────────
"Piping Connection Procedure" 16px bold #1A1F2E

7 step cards stacked (border 1px #F3F4F6, rounded-lg, 
padding 14px 16px, flex row, gap 14px):
Left: teal circle (28px) with step number white bold 12px
Right: step title 13px bold #1A1F2E + body 13px #6B7280 
line-height 1.6, margin-top 2px

Step 1 — "Check the Sealing Caps"
"Before unscrewing the sealing caps, press the small sealing 
cap with your finger until the exhaust noise stops completely, 
then loosen your finger before removing."

Step 2 — "Pre-tighten the Flare Nuts by Hand"
"Align the pipe ends and hand-tighten all flare nuts first. 
Never start with a wrench — this prevents cross-threading 
and pipe deformation."

Step 3 — "Apply Final Torque with Two Wrenches"
"Hold the pipe body with one wrench, turn the flare nut with 
the second. Apply torque per the table above for your pipe 
size. Do not overtighten — deformed connectors cannot be 
reused."

Step 4 — "Wrap Thermal Insulation on All Joints"
"Wrap each pipe joint with thermal insulation material, then 
cover with vinyl tape. Place the drain hose below all pipes. 
Use polythene foam of at least 6mm thickness throughout."

Step 5 — "Connect Vacuum Pump to Service Port"
"Remove all valve caps. Connect the vacuum pump flexible hose 
to the service port on the 3-way valve. Ensure all connections 
are tight before starting."

Step 6 — "Run Pump Until 100Pa Absolute is Reached"
"Run the vacuum pump for 10–15 minutes. Do not stop until 
the manifold gauge confirms 100Pa absolute. If 100Pa cannot 
be reached, stop and check all joints for leaks before 
proceeding."

Step 7 — "Open Valves and Verify All Joints"
"Close the low-pressure knob on the manifold, then stop the 
pump. Open the 2-way valve 1/4 turn for 10 seconds, then 
close. Check ALL joints with liquid soap or an electronic 
leak detector. Fully open both valve stems. Replace all caps."

── SECTION 6 — Critical Safety Rules ──────────────────────
"Critical Safety Rules" 16px bold #1A1F2E

3 rule cards stacked:
(bg #FEF2F2, border-left 3px solid #EF4444, rounded-lg,
padding 12px 16px, ⛔ icon red left, 13px #991B1B)

⛔ "Never use a naked flame, halide torch, or any 
   spark-producing tool near the work area. R32 is 
   flammable — any ignition source risks fire or explosion."

⛔ "Never use compressed air or oxygen to flush the circuit. 
   Only Oxygen Free Nitrogen (OFN) is permitted for purging."

⛔ "Piping connection must be on the OUTDOOR SIDE ONLY for 
   all R32 refrigerant models. Indoor connection is not 
   permitted under any circumstances."

── SECTION 7 — Key Terms ───────────────────────────────────
"Key Terms to Know" 16px bold #1A1F2E

4 term cards in 2×2 grid:
(white bg, border 1px #E5E7EB, rounded-lg, padding 14px,
term name 13px bold #1A1F2E, definition 12px #6B7280 
line-height 1.5, margin-top 4px)

"Flare Nut"
The threaded nut connecting refrigerant pipes to the valve. 
Must be pre-tightened by hand before using a wrench.

"Torque (N·m)"
Rotational force applied when tightening. Wrong torque 
deforms the pipe and causes refrigerant leaks.

"Vacuum Pump"
Removes air and moisture from the refrigerant circuit 
before refrigerant is introduced into the system.

"100Pa Absolute"
The target vacuum level confirming the system is fully 
airtight. Must be achieved before opening any valves.

── BOTTOM ACTION BAR (sticky, inside the card or below it) ─
Thin divider, then flex row:
Left: "← Back to List" grey text link
Right: "✗ Reject" (outlined red) + "✓ Approve" (solid teal)

Same buttons as the top action bar — trainer can approve 
or reject from either the top or bottom without scrolling back up.

════════════════════════════════════════════════════════════
END OF COMBINED PROMPT
════════════════════════════════════════════════════════════