Refine the rejection and regeneration flow on both MaterialReview 
and QuizReview screens. The pages have 4 distinct states for each 
module/quiz. Implement all 4 states correctly:

STATE 1 — Pending (default, keep as-is)
STATE 2 — Rejected + Reason shown
STATE 3 — Regenerating (AI working)
STATE 4 — Regenerated (new version ready, pending re-review)

Apply these changes to BOTH screens unless noted otherwise.

════════════════════════════════════════════════════════════
LEFT PANEL — Module/Quiz List
════════════════════════════════════════════════════════════

When a module/quiz is in STATE 2 (Rejected):
- Show red "Rejected" pill as usual
- Below the title, show a truncated rejection reason in 10px 
  italic #DC2626, max 1 line with ellipsis:
  e.g. "Reason: Torque table missing, steps unclear..."
- This makes it clear WHY it was rejected without opening it

When in STATE 3 (Regenerating):
- Replace the status pill with an animated loading indicator:
  small spinning circle (teal) + "Regenerating..." 10px #00C9A7
- The list item is not clickable during this state
- Show a subtle pulsing opacity animation on the whole row

When in STATE 4 (Regenerated):
- Show a teal "Regenerated" pill instead of "Pending"
  (bg #E8FAF7, text #00C9A7, 10px bold)
- Show a small "v2" badge next to the module title
  (grey pill, 9px, #6B7280)
- This signals a new version is ready for review

════════════════════════════════════════════════════════════
RIGHT PANEL — Review Actions (both screens)
════════════════════════════════════════════════════════════

STATE 1 — Pending:
Keep Approve + Reject buttons exactly as-is.

STATE 2 — After trainer submits rejection reason:
Replace the Approve/Reject buttons with:

  Red callout box (bg #FEF2F2, border 1px #FECACA, rounded-lg, 
  padding 14px):
  - Top row: XCircle icon (red) + "Rejected" 13px bold #991B1B
  - "Rejection reason sent to AI:" label 11px #9CA3AF, margin-top 6px
  - The actual reason in a grey quote box below:
    (bg #F9FAFB, border-left 2px solid #D1D5DB, padding 8px 12px,
    12px italic #374151 line-height 1.5)
    e.g. "The torque reference table is missing from the content. 
    Step 3 and Step 6 need more detail on what to do if the 
    procedure fails."
  - Below box: teal animated row:
    spinning loader icon (small, teal) + 
    "AI is analysing feedback and regenerating..." 11px #00C9A7

STATE 3 — Regenerating (3-second simulated delay):
Full right panel replaced with centred loading state:

  Teal spinning circle (32px) centred, margin-top 32px
  "Regenerating Material" 14px bold #1A1F2E, margin-top 16px, centred
  "AI is rewriting the content based on trainer feedback" 
  12px #9CA3AF centred, margin-top 4px

  Rejection reason recap box below (same grey quote style):
  "Feedback: [the reason that was submitted]"

  Animated progress bar at bottom of right panel:
  (teal fill, width animating from 0% to 100% over 3 seconds,
  height 4px, rounded, bg #E5E7EB)
  "Estimated time: ~30 seconds" 10px #9CA3AF below bar

STATE 4 — Regeneration Complete:
Right panel shows:

  Green callout box (bg #ECFDF5, border 1px #A7F3D0, rounded-lg,
  padding 14px):
  - CheckCircle icon (green) + "New Version Ready" 13px bold #065F46
  - "Version 2 generated based on your feedback" 11px #059669
  
  Below: show the original rejection reason in the grey quote box 
  with label "Your feedback was:" 11px #9CA3AF

  Then Approve + Reject buttons again (same as STATE 1) so trainer
  can review the new version and approve or reject again:
  "✓ Approve v2" — solid teal button
  "✗ Reject Again" — outlined red button

════════════════════════════════════════════════════════════
CENTER PANEL — Content Area (both screens)
════════════════════════════════════════════════════════════

STATE 2 — Rejected:
Add a red banner at the very top of the center panel 
(above all content, full width, sticky):
bg #FEF2F2, border-bottom 1px #FECACA, padding 10px 24px, flex row:
- XCircle icon (red 14px) 
- "This material was rejected —" 12px bold #991B1B
- reason truncated inline: 12px #DC2626 italic
  e.g. "Torque table missing, steps need more detail."
- "See full reason →" teal text link right-aligned (11px)
  clicking scrolls to reason in right panel

The content below still shows but with a low-opacity overlay 
(opacity 0.5) to visually indicate it is the OLD version that 
was rejected. 

STATE 3 — Regenerating:
Replace the entire center content area with a centred 
loading illustration:

  Large teal pulsing circle (64px) with sparkle/AI icon inside
  centred on the page, margin-top 80px

  "AI Regenerating Content" 18px bold #1A1F2E, centred, margin-top 20px

  "Analysing trainer feedback and rewriting module content..."
  13px #9CA3AF centred, margin-top 6px

  The rejection reason in a wider grey quote card below:
  (bg white, border 1px #E5E7EB, rounded-lg, padding 16px, 
  max-width 480px, centred, margin-top 24px)
  "Trainer Feedback:" 11px bold #9CA3AF uppercase, margin-bottom 6px
  [the reason text] 13px #374151 italic line-height 1.6

  Animated 3-dot pulsing indicator below the card (teal dots)

STATE 4 — Regenerated (new version ready):
Show a teal banner at top of center panel:
bg #F0FDF9, border-bottom 1px #A7F3D0, padding 10px 24px, flex row:
- Sparkle icon (teal) 
- "Version 2 ready for review" 12px bold #065F46
- "Regenerated based on: [short reason snippet]" 
  12px #059669 italic, margin-left 8px
- "View changes ↓" teal text link right-aligned

Then show the full content as normal (full opacity, 
same rich sections as the approved content).

Add a small "v2" badge next to the module title in the 
page header (teal pill, 10px, same style as left panel).

════════════════════════════════════════════════════════════
REVIEW HISTORY (QuizReview right panel — already exists)
════════════════════════════════════════════════════════════

Keep the existing review history section but update styling:

Each history entry card:
- Approved entries: green left border 2px + existing style
- Rejected entries: red left border 2px + show full reason 
  below in grey italic quote style (not just the reason 
  inline — give it its own clearly labelled block)

Add a "Regenerated by AI" entry type:
- Teal left border 2px
- Sparkle icon + "AI Regenerated" teal pill
- "v2 generated based on trainer feedback" 11px #059669
- Timestamp

════════════════════════════════════════════════════════════
DEMO DATA — Pre-set Module 5 as already in STATE 2 (Rejected)
════════════════════════════════════════════════════════════

Set Module 5 "Maintenance & Troubleshooting" as Rejected with:
Reason: "The troubleshooting table is incomplete — it only covers 
3 fault cases but the SOP has 9. The filter cleaning procedure 
is also missing the 100-hour cleaning interval requirement. 
Please regenerate with all fault cases and full maintenance steps."

This gives the demo an immediate example of STATE 2 to show 
without the trainer having to perform the rejection live.

Set Module 4 "Electrical Wiring & Cable Specs" as Regenerated 
(STATE 4) so the demo also shows what a completed regeneration 
looks like — v2 badge in left panel, green banner in center, 
Approve v2 button in right panel.