Refine only the existing V2 “Team Appraisals” and “Final Appraisal Recommendation” screens.

IMPORTANT:
- Use the current V2 screens as the direct base.
- Do not redesign or rebuild existing layouts.
- Preserve the current APEX styling, components, spacing, tables, cards and charts.
- Do not modify unrelated Staff Performance screens.
- Make only the V3 changes below.

==================================================
1. TEAM APPRAISALS — SCORE SORTING
==================================================

Make these table columns sortable:
- KPI Performance Score
- Attitude Evaluation Score
- Final Appraisal Score

Support:
- Highest to Lowest
- Lowest to Highest

Show a clear sort indicator on the active column.
Only one primary sort needs to be active at a time.

==================================================
2. STANDARDISE APPRAISAL STATES
==================================================

Use these appraisal states consistently:

- Ready for Appraisal
- Draft
- Pending Review
- Return for Revision
- Approve
- Override and Approve

Remove previous terminology:
- Pending HR Review
- Finalised
- Returned for Revision

Team Appraisals row actions:

Ready for Appraisal
→ Start Appraisal

Draft
→ Continue Appraisal

Pending Review
→ View Submission

Return for Revision
→ Revise Appraisal

Approve
→ View Appraisal

Override and Approve
→ View Appraisal

For the summary cards, keep the layout concise:

- Ready for Appraisal
- Draft
- Pending Review
- Return for Revision
- Approved

“Approved” summary count combines:
- Approve
- Override and Approve

==================================================
3. STATUS-SPECIFIC APPRAISAL PAGE
==================================================

Reuse the existing Final Appraisal Recommendation page for all statuses.

Do NOT create separate detail pages.

Change the page data, status banner and available actions based on the selected employee.

READY FOR APPRAISAL
- New editable appraisal
- Manager Recommendation is empty
- Recommendation Justification is empty
- Actions: Save Draft / Submit to HR

DRAFT
- Editable
- Restore previously saved Manager Recommendation and Recommendation Justification
- Actions: Save Draft / Submit to HR

PENDING REVIEW
- Read-only
- Show submitted Manager Recommendation
- Show Recommendation Justification
- Show submission date
- Hide Save Draft and Submit to HR

RETURN FOR REVISION
- Show HR return reason and returned date
- Allow Manager to edit the recommendation and justification
- Action: Resubmit to HR

APPROVE
- Read-only
- Show Manager Recommendation
- Show HR Final Decision
- Show HR finalisation remarks
- Show approval/finalisation date
- Hide editing actions

OVERRIDE AND APPROVE
- Read-only
- Show original Manager Recommendation
- Show HR Final Decision
- Show HR Override Reason
- Show HR finalisation remarks
- Show approval/finalisation date
- Hide editing actions

==================================================
4. ANNUAL KPI REVIEW PERIOD SELECTOR
==================================================

Fix the Review Period selector so different Annual KPI Review Periods display different prototype data.

Changing the Review Period must update:
- Summary card counts
- Employee rows
- KPI Performance Scores
- Attitude Evaluation Scores
- Final Appraisal Scores
- Appraisal statuses
- Available actions

For example:
- 2027 may contain Ready for Appraisal, Draft and Pending Review records.
- Previous review periods should mainly contain Approve or Override and Approve records.

Do not reuse identical employee scores and statuses across every Review Period.

==================================================
5. PREVIOUS APPRAISALS
==================================================

On the existing Final Appraisal Recommendation page, add a compact collapsed section below the Performance Trend:

“Previous Appraisals”

Keep it collapsed by default.

Display up to the previous 5 available annual appraisal records.

Use columns:
- Review Period
- Final Appraisal Score
- Manager Recommendation
- Appraisal Status
- HR Final Decision
- Action

Example:

2026 | 77.3 | Salary Increment | Approve | Salary Increment | View Details
2025 | 76.1 | No Recommendation | Approve | No Recommendation | View Details
2024 | 74.8 | Promotion | Override and Approve | Salary Increment | View Details

Clearly distinguish:
- Manager Recommendation
- Appraisal Status
- HR Final Decision

Do not use “Approved” as the HR Final Decision.

HR Final Decision should use:
- Promotion
- Salary Increment
- Both
- No Recommendation

Show only available historical records.
Do not treat missing years as zero.

==================================================
6. HISTORICAL APPRAISAL DETAILS
==================================================

Selecting “View Details” from Previous Appraisals should open a compact read-only drawer.

Show:
- Review Period
- KPI Performance Score
- Attitude Evaluation Score
- Final Appraisal Score
- Manager Recommendation
- Recommendation Justification
- Appraisal Status
- HR Final Decision
- HR Override Reason, if applicable
- HR Finalisation Remarks
- Approval/finalisation date

Managers are allowed to view historical HR Override Reasons and HR Finalisation Remarks.

For an “Approve” record:
- HR Override Reason is not required.

For an “Override and Approve” record:
- Clearly show the original Manager Recommendation
- Final HR Decision
- HR Override Reason

==================================================
7. HISTORICAL INFORMATION RULE
==================================================

Previous appraisal records are supporting information only.

They must NOT:
- Change the current Final Appraisal Score
- Automatically determine the current Manager Recommendation
- Generate any Readiness Score
- Be automatically used as input to AI Appraisal Insight in V3

Keep the existing 3-Year / 5-Year Performance Trend separate from Previous Appraisals:

Performance Trend
= how the employee’s performance changed over time.

Previous Appraisals
= what Managers previously recommended and what HR finally decided.

==================================================
8. KEEP EVERYTHING ELSE
==================================================

Keep the existing V2:
- Team Appraisals layout
- Filters
- Score cards
- Final Appraisal Recommendation layout
- KPI Performance Score
- Attitude Evaluation Score
- Final Appraisal Score
- 3-Year / 5-Year Performance Trend
- Manager Recommendation
- Recommendation Justification
- AI Appraisal Insight
- Save Draft
- Submit to HR

Do not redesign components that already work.

Use local prototype state for all V3 interactions.