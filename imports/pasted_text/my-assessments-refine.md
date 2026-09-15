Refine only Screen 3, “My Assessments”, in the existing APEX Staff Appraisal and KPI Tracking prototype.

Use the current My Assessments screen as the direct base. Preserve the existing APEX sidebar, header, typography, colours, cards, tables, tabs, buttons, spacing and status patterns.

Do not modify other Staff Performance screens.

V2 OBJECTIVE

Keep this page focused on completing:

1. KPI Self-Assessments for the selected Review Checkpoint.
2. Annual Attitude Self-Assessment.

Do not turn this page into an Employee Performance Dashboard.

The Employee Performance Dashboard will be designed separately for:
- Current performance monitoring
- Historical results
- 3–5 year performance trends
- Upcoming deadlines
- Superior Assessment results
- KPI progress

PAGE INFORMATION

Route:
/performance/my-assessments

Primary user:
Employee

Sample employee:
- Name: Amir Hassan
- Staff ID: RS-1042
- Role: Retail Sales Executive
- Department: Retail Sales
- Review period: 2027 Annual KPI Review
- Role-Based Review Frequency: Monthly
- Applicable Attitude Evaluation Format: Sales


==================================================
PAGE STRUCTURE
==================================================

Keep two tabs:

1. Monthly KPI Assessment
2. Annual Attitude Self-Assessment

The active tab should clearly indicate which assessment the employee is completing.

Do not show:
- Performance trend charts
- Historical performance analytics
- Superior Assessment Scores
- Team comparisons
- Organisation statistics
- KPI progress dashboards

These belong to separate dashboard screens.


==================================================
TAB 1: MONTHLY KPI ASSESSMENT
==================================================

REVIEW CHECKPOINT HEADER

Retain the Review Checkpoint selector.

Example:
February 2027 ▼

Display compact checkpoint information beside or below the selector:
- Assessment Status
- Review Checkpoint date
- Self-Assessment deadline
- Number of KPIs to complete

Example:
- Status: Draft
- Review Checkpoint: 28 February 2027
- Submission Deadline: 5 March 2027
- KPIs: 7

Keep this information compact. Do not introduce large summary cards that create unnecessary vertical space.

Use sample checkpoint states such as:
- January 2027 — Reviewed
- February 2027 — Draft
- March 2027 — Upcoming

Use February 2027 as the current selected checkpoint.

Changing the Review Checkpoint must update:
- Self-Assessment Scores
- Comments
- Attached evidence
- Deadline
- Assessment status

CHECKPOINT BEHAVIOUR

Reviewed:
- Display previously submitted Self-Assessment information as read-only.
- Do not allow editing.

Draft:
- Allow the employee to complete and edit the assessment.
- Allow Save Draft and Submit Assessment.

Upcoming:
- Allow the checkpoint to be selected for viewing.
- Disable assessment controls.
- Display:

“This Review Checkpoint is not yet open for Self-Assessment.”

Do not add trend charts, historical comparison cards or Superior Assessment results when viewing previous checkpoints.


==================================================
INSTRUCTION
==================================================

Display this instruction above the KPI table:

“Select a Self-Assessment Score from 0–5 based on the scoring criteria defined for each KPI. Add a supporting comment or evidence where appropriate.”


==================================================
KPI TABLE
==================================================

Remove the Source column completely.

Remove the Achievement column completely.

Remove all:
- System-Provided badges
- Manual Entry badges
- Source descriptions
- Database-source labels
- Achievement input fields

The employee does not enter a separate Achievement value on this screen.

The purpose of the Monthly KPI Assessment is:

Review KPI and Target
→ Review KPI-specific Scoring Criteria
→ Select Self-Assessment Score
→ Add optional Comment/Evidence
→ Submit Assessment

Use these main columns in this exact order:

- KPI Name
- Target
- Self-Assessment Score
- Comment / Evidence

Do not add these as permanent table columns:
- Perspective
- KRA
- Achievement
- Full Scoring Definition
- Data Source

Use the employee’s confirmed KPIs from My KPI Plan.

Example KPI rows:
- Company Revenue Growth
- Customer Satisfaction Index
- Branch Operations Score
- Monthly Sales Achievement
- Product Coverage
- New Customer Acquisition
- Cross-Sell Rate


==================================================
KPI NAME
==================================================

For each KPI, display:
- KPI Name
- KPI Level badge
- Small “View Scoring Criteria” action

Example:

Monthly Sales Achievement
[Department-Level]
View Scoring Criteria

Keep this compact and easy to scan.

Do not show Perspective or KRA directly in the table.


==================================================
TARGET
==================================================

Display the target defined for each KPI.

Example formats:
- ≥ 8% YoY
- ≥ 85%
- ≥ 90%
- RM80,000/month
- ≥ 80% product range
- 10 new customers/month
- ≥ 20%

Targets are read-only on this assessment screen.


==================================================
VIEW SCORING CRITERIA
==================================================

Selecting “View Scoring Criteria” should open a small KPI-specific detail drawer.

Display:
- KPI Name
- Target
- Score 5 criteria
- Score 4 criteria
- Score 3 criteria
- Score 2 criteria
- Score 1 criteria
- Score 0 criteria

Example for Personal Sales Target:

- Score 5: Achieves 110% or more of the target
- Score 4: Achieves 100%–109% of the target
- Score 3: Achieves 90%–99% of the target
- Score 2: Achieves 75%–89% of the target
- Score 1: Achieves 50%–74% of the target
- Score 0: Achieves less than 50% of the target

Clearly label these as:

“KPI-Specific Scoring Criteria”

Add this explanation:

“Each KPI may use different achievement thresholds. Review these criteria before selecting your Self-Assessment Score.”

Do not apply one universal numerical threshold to every KPI.


==================================================
SELF-ASSESSMENT SCORE
==================================================

Replace the existing score selector:

1 | 2 | 3 | 4 | 5

With:

0 | 1 | 2 | 3 | 4 | 5

Use a compact segmented control or radio-button group.

Requirements:
- Only one score may be selected per KPI.
- Clearly highlight the selected score.
- Score 0 must be clearly visible and selectable.
- Display the conceptual score label when a score is selected.

General conceptual labels:
- 5 — Exceptional
- 4 — Exceeds Expectations
- 3 — Meets Expectations
- 2 — Partially Meets Expectations
- 1 — Needs Significant Improvement
- 0 — Not Achieved

The KPI-specific scoring criteria remain the primary basis for selecting the score.


==================================================
COMMENT / EVIDENCE
==================================================

Provide a compact comment field for each KPI.

Example placeholder:

“Add supporting comment…”

Comments are optional unless later confirmed otherwise by TBM.

Add an “Attach Evidence” action inside the same KPI row.

Evidence must be attached to the relevant KPI.

Remove the existing single global Upload Evidence action currently displayed below the entire KPI table.


==================================================
ATTACH EVIDENCE INTERACTION
==================================================

Selecting “Attach Evidence” must open an interactive file-selection control.

Prototype file requirements:
- Accepted formats: PDF, PNG, JPG and JPEG
- Maximum size: 10 MB
- Use local prototype state only
- No backend upload is required

After selecting a file, display:
- File icon
- Filename
- File size
- View action
- Remove action

Example:

sales-report-february-2027.pdf
2.4 MB
View | Remove

Selecting View should open a simple preview dialog or file-information modal.

Selecting Remove should ask for confirmation before removing the attachment.

Show clear validation messages for:
- Unsupported file format
- File larger than 10 MB

Evidence remains optional unless later confirmed otherwise by TBM.


==================================================
SAVE AND SUBMIT
==================================================

Retain:
- Save Draft
- Submit Assessment

SAVE DRAFT

Save Draft should:
- Save selected Self-Assessment Scores
- Save comments
- Retain locally attached evidence
- Keep assessment status as Draft

Do not require every KPI to be scored before Save Draft.


SUBMIT ASSESSMENT

Submit Assessment should only be enabled when:
- Every required KPI has a Self-Assessment Score from 0–5
- No attached evidence file has a validation error

Do not require:
- Achievement values
- Comments for every KPI
- Evidence for every KPI

unless later confirmed otherwise by TBM.

When Submit Assessment is disabled, display:

“Complete the Self-Assessment Score for all KPIs before submitting.”


==================================================
SUBMISSION CONFIRMATION
==================================================

Selecting Submit Assessment should open a confirmation dialog.

Display:
- Review Checkpoint
- Number of completed KPIs
- Number of attached evidence files
- Submission deadline
- Manager receiving the submission

Example message:

“You are submitting your KPI Self-Assessment for February 2027 to your Manager. After submission, you will not be able to edit it unless it is returned for revision.”

Actions:
- Cancel
- Submit to Manager


==================================================
AFTER SUBMISSION
==================================================

After successful submission:
- Change assessment status to Submitted
- Make Self-Assessment Scores read-only
- Make comments read-only
- Make attached evidence read-only
- Hide or disable Save Draft
- Replace Submit Assessment with a Submitted status

Display:

“Your KPI Self-Assessment for February 2027 has been submitted to your Manager.”

Add:

“You can edit this assessment again only if your Manager returns it for revision.”


==================================================
RETURNED FOR REVISION
==================================================

Support a prototype Returned for Revision state.

Display:
- Returned for Revision status
- Manager’s return reason
- Date returned

Example:

Returned for Revision
Reason: Please provide additional supporting information for the Cross-Sell Rate KPI.
Returned: 8 March 2027

Make the assessment editable again.

Actions:
- Save Draft
- Resubmit Assessment

When resubmitted:
- Change status back to Submitted
- Make assessment read-only again
- Send it back to the Manager review flow


==================================================
TAB 2: ANNUAL ATTITUDE SELF-ASSESSMENT
==================================================

Retain the existing Annual Attitude Self-Assessment tab.

Preserve only these three existing evaluation formats:
- Manager
- Sales
- Others

Do not introduce additional evaluation formats or reorganise the existing criteria into newly invented categories.


==================================================
FORM SELECTION
==================================================

Automatically determine the applicable Attitude Evaluation format from the employee’s role.

For Amir Hassan:

Applicable Form:
Sales

Reason:
Retail Sales Executive role

Show a small badge:

“Sales Evaluation Form”

Add helper text:

“This evaluation format is selected based on your current role.”

Do not provide an employee-controlled dropdown for changing the evaluation format.

Keep the role-to-format mapping as a prototype assumption that can be changed after stakeholder validation.


==================================================
ATTITUDE FORM
==================================================

Preserve the current Sales attitude criteria and layout already used in the V1 prototype.

Do not replace the existing criteria with newly invented categories.

Display the existing:
- Core Value or criterion
- Description
- Existing rating scale
- Self-Assessment Score
- Employee comment, where currently supported

Do not change the existing Attitude rating scale unless separately requested.


==================================================
ANNUAL ATTITUDE INFORMATION
==================================================

Display:
- Review Period
- Applicable Evaluation Form
- Assessment Status
- Attitude Self-Assessment Deadline

Do not display the Monthly Review Checkpoint selector inside the Attitude tab.

The Attitude Self-Assessment is an annual assessment.


==================================================
ATTITUDE SUBMISSION
==================================================

Retain:
- Save Draft
- Submit Assessment

Save Draft should preserve the employee’s current entries.

Submit Assessment should only be enabled when every required Attitude criterion has been scored.

After submission:
- Change status to Submitted
- Make submitted values read-only

Display:

“Your Annual Attitude Self-Assessment has been submitted to your Manager.”


==================================================
PROTOTYPE INTERACTIONS
==================================================

Implement these interactions using local prototype state:

- Switch between KPI and Attitude tabs
- Change Review Checkpoint
- Update displayed checkpoint data
- Display Reviewed, Draft and Upcoming checkpoint states
- Select Self-Assessment Scores from 0–5
- Open KPI-specific Scoring Criteria drawer
- Enter KPI comments
- Open the file-selection interaction
- Attach evidence to a specific KPI
- View attached evidence information
- Remove attached evidence
- Save a draft
- Submit an assessment
- Display submission confirmation
- Display Submitted state
- Display Returned for Revision state
- Resubmit a returned assessment
- Automatically display the Sales Attitude Evaluation format for Amir
- Make submitted and reviewed assessments read-only


==================================================
DESIGN REQUIREMENTS
==================================================

Preserve the existing APEX visual design.

Keep the screen:
- Compact
- Task-focused
- Easy to scan
- Consistent with My KPI Plan
- Understandable to non-technical TBM stakeholders

Do not add unnecessary dashboard cards or analytics.

The primary purpose of this screen should remain immediately clear:

“My Assessments is where the employee completes and submits required KPI and Annual Attitude Self-Assessments.”