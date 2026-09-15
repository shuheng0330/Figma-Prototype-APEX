Refine only the Review Period Management portion of the existing APEX Staff Appraisal and KPI Tracking prototype.

Do not redesign the rest of the APEX application. Preserve the existing sidebar, header, typography, colours, cards, tables, buttons, spacing and component patterns.

V2 OBJECTIVE

Improve Screen 1 by:

1. Adding a Review Period List page.
2. Making dates and review frequencies genuinely editable.
3. Supporting fixed and relative deadline rules.
4. Reorganising the long setup form into clearer sections.
5. Keeping Role-Based Review Frequency inside the review-period setup.

Do not create a separate global frequency configuration page.

PAGE 1: REVIEW PERIOD LIST

Route:
 /performance/review-periods

Purpose:
Provide an entry point where Super Admin can view current and historical Annual KPI Review Periods.

Page structure:
- Breadcrumb: Staff Performance > Review Periods
- Page title: Review Periods
- Short description explaining that each period stores its own frequency, deadline and weightage configuration
- Primary button: Create New Review Period
- Search field
- Status filter
- Year filter
- Review-period table

Table columns:
- Review Period Name
- Performance Period
- Eligible Staff Group
- Status
- Last Updated
- Actions

Use sample records:
- 2027 Annual KPI Review — Draft
- 2026 Annual KPI Review — Open
- 2025 Annual KPI Review — Closed
- 2024 Annual KPI Review — Closed

Supported status badges:
- Draft
- Upcoming
- Open
- Closed
- Cancelled

Row actions:
- View
- Edit, when the period is editable
- Closed and Cancelled periods must open as read-only
- Do not include Delete unless later confirmed by TBM

Selecting Create New Review Period or Edit should open the Annual KPI Review Setup page.

PAGE 2: ANNUAL KPI REVIEW SETUP

Routes:
- /performance/review-periods/new
- /performance/review-periods/:id/edit
- /performance/review-periods/:id/view

Support three page modes:
- Create
- Edit
- Read-only

Use clearly separated cards for:
1. General Settings
2. Role-Based Review Frequency
3. Deadline Settings
4. Weightage Configuration
5. Configuration Summary

SECTION 1: GENERAL SETTINGS

Fields:
- Review Period Name
- Eligible Staff Group
- Start Date
- End Date

Start Date and End Date must use working date-picker components with calendar icons.

Requirements:
- Clicking the field or calendar icon opens the date picker
- Selected dates update the form
- Use DD/MM/YYYY consistently
- End Date cannot be earlier than Start Date
- Show a clear inline validation message for invalid dates
- In read-only mode, display the saved values without editable controls

SECTION 2: ROLE-BASED REVIEW FREQUENCY

Keep this section inside Annual KPI Review Setup.

Add:
- Department filter
- Role search
- Editable role-frequency table

Table columns:
- Department / Role
- System Default
- Frequency for This Review Period
- Number of Checkpoints
- Configuration Status
- Action

Frequency dropdown options:
- Monthly
- Quarterly
- Annually

Example values:
- Retail Sales Executive: system default Monthly
- Customer Service Officer: system default Quarterly
- Branch Manager: system default Annually

Behaviour:
- System Default represents the value obtained from existing system configuration
- Frequency for This Review Period must remain editable
- Number of Checkpoints is automatically derived:
  Monthly = 12
  Quarterly = 4
  Annually = 1
- Show “Using Default” when unchanged
- Show “Overridden” when Super Admin selects another frequency
- Provide a Reset to Default action
- Save selected values as part of the current review period snapshot
- Future changes to system defaults must not silently alter an existing review period
- Label database-provided values as “Example system defaults — source to be confirmed with TBM”

SECTION 3: DEADLINE SETTINGS

Divide this card into four visible subsections.

A. KPI Setup Deadlines

Use editable date pickers for:
- Company KPI Creation Deadline
- Department KPI Creation Deadline
- Individual KPI Submission Deadline
- Individual KPI Approval Deadline

Show the deadlines in their expected sequence. Display a warning when the sequence is invalid.

B. KPI Assessment Deadline Rules

Use relative rule builders rather than fixed annual dates.

Employee Self-Assessment rule:
- Number input
- Day type selector: Calendar Days or Working Days
- Reference event: After Review Checkpoint

Example:
5 Calendar Days after Review Checkpoint

Manager Review rule:
- Number input
- Day type selector
- Reference event: After Employee Self-Assessment Deadline

Example:
5 Calendar Days after Employee Self-Assessment Deadline

Display “Day type requires TBM confirmation” near the rule controls.

Derive Review Checkpoints automatically:
- Monthly: end of each calendar month within the review period
- Quarterly: end of each calendar quarter within the review period
- Annually: the review period End Date

Add a Preview Generated Schedule action.

The preview should show examples such as:
- Role
- Frequency
- Review Checkpoint
- Self-Assessment Deadline
- Manager Review Deadline

When a frequency, review-period date or relative rule changes, automatically update the preview.

C. ATTITUDE EVALUATION DEADLINES

Use separate editable date pickers for:
- Attitude Self-Assessment Deadline
- Superior Attitude Evaluation Deadline

Validate that the Superior Evaluation deadline is not earlier than the Attitude Self-Assessment deadline.

D. FINAL APPRAISAL DEADLINES

Use separate editable date pickers for:
- Manager Appraisal Recommendation Deadline
- HR Review and Finalisation Deadline

Allow these dates to occur after the annual performance End Date.

Validate that HR Finalisation is not earlier than the Manager Recommendation deadline.

SECTION 4: WEIGHTAGE CONFIGURATION

Retain the existing weightage settings.

KPI-level allocation:
- Company-Level KPI
- Department-Level KPI
- Individual-Level KPI
- Total must equal 100%

Final appraisal allocation:
- KPI Performance
- Attitude Evaluation
- Total must equal 100%

Use editable percentage inputs and a clear total indicator.

SECTION 5: CONFIGURATION SUMMARY

Provide a compact summary before publishing:
- Review period
- Eligible staff group
- Number of included roles
- Frequency distribution
- KPI allocation
- Final appraisal allocation
- Deadline-rule summary
- Validation warnings

A Preview Configuration action should open this summary in a drawer or modal.

ACTIONS

Create or Edit mode:
- Cancel
- Save Draft
- Preview Configuration
- Publish Review Period

Read-only mode:
- Back to Review Periods
- No editable fields
- No Publish button

INTERACTION REQUIREMENTS

- All date pickers and dropdowns must be clickable and update local prototype state
- Save Draft must retain entered values while navigating within the prototype
- Show confirmation dialogs before publishing
- Prevent publishing when required fields are missing or weightages do not total 100%
- Use plain-language validation messages
- Add short helper text explaining unfamiliar settings
- Do not rely on colour alone to communicate status
- Keep the interface readable on a standard laptop screen

Do not modify the other Staff Performance screens in this V2 task.