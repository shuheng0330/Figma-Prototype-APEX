Design a staff performance dashboard that shows different content 
depending on who is viewing it. This is one screen with three states.

Add a toggle at the top: "Viewing as: [Staff / Manager / HR Admin]" 
to switch between the three states for prototyping purposes.

═══════════════════════════════════════════
STATE 1 — HR Admin reviewing a staff member's profile
(navigated from "Review" button in candidate list)
═══════════════════════════════════════════

Show Zone A (performance data) PLUS Zone C (HR appraisal review panel).

Zone A components (same as always):
1. Profile card: photo placeholder, name, email, department, role

2. Performance Trend chart (line chart):
   - Y-axis: Score (0–100%)
   - X-axis: Year labels (2021–2025)
   - Single line for this staff's score per year
   - Pill toggle above chart: 1Y / 3Y / 5Y / All
   - Hovering a point shows: Year, Score, YoY change (e.g. +4.2%)

3. Latest Evaluation card:
   - Overall score (large, coloured by category)
   - Competency ratings listed with score out of 10

4. Historical Evaluations list:
   - Each row: cycle name, score, YoY delta arrow (green up / red down)
   - A counter: "X consecutive cycles meeting expectation (≥70%)"

Zone C — HR Appraisal Review Panel:
Show a clearly separated section below Zone A labelled 
"Appraisal Review — HR Admin".

This panel is always read-only for HR. 
HR cannot edit the manager's inputs.

Display the following fields in read-only format:
   - Review Period (e.g. "Cycle 2023–2025")
   - Decision Type badge (Promotion / Salary Increment / Both)

   - If Decision Type is Promotion or Salary Increment:
       - Readiness Score (single value, e.g. 78)
       - System Category badge (Ready / Borderline / Needs Improvement)
       - Manager Override — if overridden: show original system category 
         struck through → overridden category, plus override reason text
       - If not overridden: show "No override"

   - If Decision Type is Both:
       - Show two side-by-side sections — "Promotion" and 
         "Salary Increment" — each with their own:
           - Readiness Score
           - System Category badge
           - Manager Override (if any) with override reason

   - AI Insight — if generated: show the paragraph of insight text 
     in a light grey box labelled "AI-generated insight"
     If not generated: show "Not generated"

   - Manager Comment — show in a quoted text box

   - Current appraisal status badge at the top right of the panel:
     (Pending / Returned / Approved)

Below the read-only fields, show HR's action buttons:

   PENDING state — show three action buttons:
     - "Approve" (filled green) — clicking changes status to Approved, 
       locks the record, shows a success confirmation
     - "Override and Approve" (filled amber) — clicking reveals:
         - If Decision Type is single: one dropdown to select 
           final category + one required text field "HR override reason"
         - If Decision Type is Both: two rows — one per decision type — 
           each with a category dropdown and override reason field
         - A "Confirm Override and Approve" button
     - "Return for Revision" (outlined red) — clicking reveals:
         - A required textarea "Return reason for manager"
         - A "Confirm Return" button — sends record back to manager

   APPROVED state — show all fields read-only with green "Approved" 
     badge, approval date, and HR override details (if any). 
     No action buttons.

   RETURNED state — show all fields read-only with red "Returned" 
     badge and the return reason HR previously wrote. 
     No action buttons (waiting for manager to resubmit).

Add a "Panel state" selector (Pending / Approved / Returned) 
for prototyping to switch between HR action states.

═══════════════════════════════════════════
STATE 2 — Manager viewing a staff member's profile 
(via "View Details" from team dashboard)
═══════════════════════════════════════════

Show Zone A (same as above) PLUS Zone B (manager appraisal panel) 
below it.

Zone B — Appraisal Panel (Manager view only):
Show a clearly separated section below Zone A labelled 
"Appraisal Panel — Manager Only".

- EMPTY state (no appraisal submitted yet): show a form with:
  - Review Period dropdown (list of past cycles e.g. "Cycle 2023–2025")
  - Decision Type radio: Promotion / Salary Increment / Both / None

  - If Decision Type is Promotion or Salary Increment:
      - Read-only Readiness Score (e.g. 78) and System Category badge
      - Override toggle checkbox "Override system category" — 
        when checked reveals: category dropdown + override reason field
      - "Generate AI Insight" button — shows loading state then 
        displays read-only insight paragraph

  - If Decision Type is Both:
      - Show two side-by-side sections — "Promotion" and 
        "Salary Increment" — each with:
          - Read-only Readiness Score and System Category badge
          - Independent override toggle with category dropdown 
            and override reason field
          - Independent "Generate AI Insight" button

  - Manager Comment textarea (one shared field, required)
  - Two buttons: "Save Draft" (outlined) and "Submit to HR" (filled primary)

- PENDING state: all fields read-only with "Pending HR Review" badge. 
  No edit buttons.

- RETURNED state: all fields read-only + HR return reason in a 
  highlighted red warning box + "Edit and Resubmit" button 
  that unlocks all fields.

- APPROVED state: all fields read-only with green "Approved" badge 
  + approval date + HR override details (if any).

Add a "Panel state" selector (Empty / Pending / Returned / Approved) 
for prototyping.

═══════════════════════════════════════════
STATE 3 — Staff viewing their own profile
═══════════════════════════════════════════

Show Zone A only. No appraisal panel of any kind. 
No hint that an appraisal panel exists below.

Zone A is identical to the Zone A described above.

═══════════════════════════════════════════
INTERACTIONS
═══════════════════════════════════════════

- The "Viewing as" toggle at the top switches between 
  HR Admin / Manager / Staff states
- The year pill toggle (1Y / 3Y / 5Y / All) updates the trend chart
- Panel state selectors are visible only in Manager and HR Admin views
- Hovering a chart point shows the tooltip (Year, Score, YoY change)
- All action buttons in HR Admin view show confirmation states 
  when clicked
- "Generate AI Insight" button shows a loading spinner 
  then reveals insight text
- Override toggle reveals/hides the override fields smoothly
