Refine only Screen 2, “My KPI Plan”, in the existing APEX Staff Appraisal and KPI Tracking prototype.

Use the current My KPI Plan screen as the direct base. Do not rebuild its overall layout and do not modify other Staff Performance screens.

Preserve:
- Existing APEX sidebar and header
- Page layout and spacing
- Employee summary card
- KPI Plan Status
- KPI Weightage Total card
- Existing table style
- KPI Level and status badges
- Existing colours, typography, cards, buttons, drawers and dialogs

V2 OBJECTIVE

Improve the screen by:

1. Keeping the main KPI table concise.
2. Moving detailed KPI information into a View drawer.
3. Allowing employees to define Individual-Level KPIs and Score 0–5 criteria.
4. Adding clear weightage validation.
5. Clarifying which KPIs require Manager approval.
6. Removing data-source information from KPI-plan definition.

Do not create:
- A Perspective/KRA configuration page
- A scoring-template administration page
- Data-source configuration
- Backend or database integration
- Additional Staff Performance screens

PAGE INFORMATION

Route:
 /performance/my-kpi-plan

Primary user:
 Employee

Sample employee:
- Name: Amir Hassan
- Staff ID: RS-1042
- Role: Retail Sales Executive
- Department: Retail Sales
- Manager: Sales Manager
- Review period: 2027 Annual KPI Review
- Role-Based Review Frequency: Monthly

PAGE HEADER

Keep:
- Breadcrumb: Staff Performance > My KPI Plan
- Page title: My KPI Plan
- View Scoring Guide button
- Add Individual KPI button

Change the page subtitle from:
“2027 Annual KPI Review • Monthly Checkpoint • Retail Sales Executive”

To:
“2027 Annual KPI Review • Retail Sales Executive • Monthly Review Frequency”

The KPI plan belongs to the Annual KPI Review Period, not one monthly Review Checkpoint.

Replace the button:
“Submit KPI Plan”

With:
“Submit Individual KPIs for Approval”

EMPLOYEE SUMMARY

Retain the existing employee summary card.

Display:
- Employee name
- Staff ID
- Role
- Department
- Reporting Manager
- KPI Plan Status

Suggested KPI Plan statuses:
- Draft
- Pending Manager Approval
- Returned for Revision
- Confirmed

KPI WEIGHTAGE SUMMARY

Retain and enhance the existing KPI Weightage Total card.




Behaviour:
- Update the total immediately after an Individual KPI is added or edited.
- Show a clear error when the total exceeds 100%.

KPI TABLE INTRODUCTION

Replace the current description with:

“Company and Department KPIs are assigned to you. Individual KPIs are proposed by you and require Manager approval.”

Avoid the term “system-provided” because it may be confused with the source of actual performance data.

MAIN KPI TABLE

Remove the Data Source column completely.

Also remove all data-source information currently displayed below KPI names, including:
- “Example source: POS Database — To Be Confirmed”
- “System-Provided”
- “Manual Entry”

Data sources will be handled later during KPI performance tracking, not KPI-plan definition.

Use these table columns in this exact order:
- KPI Level
- KPI Name
- Target
- Weightage
- Approval Status
- Actions

Do not show these as table columns:
- Perspective
- KRA
- Scoring Definition

Keep the existing sample KPI records:
- Company Revenue Growth — Company-Level — 5%
- Customer Satisfaction Index — Company-Level — 7%
- Branch Operations Score — Company-Level — 3%
- Monthly Sales Achievement — Department-Level — 15%
- Product Coverage — Department-Level — 10%
- New Customer Acquisition — Individual-Level — 30%
- Cross-Sell Rate — Individual-Level — 30%

The total should remain 100%.

APPROVAL STATUS

Company- and Department-Level KPIs should display:
“Assigned”

Do not display “Approved” because these KPIs are assigned to the employee and do not follow the Individual KPI approval workflow.

Individual-Level KPI statuses:
- Draft
- Pending Manager Approval
- Returned for Revision
- Approved

Use clear status badges with both colour and text.

ACTIONS COLUMN

Every KPI must have a View action.

Company-Level KPI:
- View

Department-Level KPI:
- View

Individual-Level KPI with Draft or Returned status:
- View
- Edit

Individual-Level KPI with Pending Manager Approval or Approved status:
- View only

KPI DETAIL DRAWER

Selecting View must open a read-only KPI Detail drawer.

Use two clear sections.

SECTION 1: KPI DETAILS

Display:
- KPI Level
- Perspective
- KRA
- KPI Name / Description
- Target
- Weightage
- Review Period
- Status

SECTION 2: SCORING DEFINITION

Display:
- Score 5 criteria
- Score 4 criteria
- Score 3 criteria
- Score 2 criteria
- Score 1 criteria
- Score 0 criteria

Company- and Department-Level KPIs must always be read-only in the Employee view.

For a Draft or Returned Individual KPI, include an Edit KPI button.

For a Pending Individual KPI, display:
“This KPI is awaiting Manager review.”

For an Approved Individual KPI, display:
“This KPI has been approved and is part of your confirmed KPI plan.”

CREATE/EDIT INDIVIDUAL KPI DRAWER

Open this drawer when the employee selects:
- Add Individual KPI
- Edit on a Draft or Returned Individual KPI

Drawer titles:
- Create Individual KPI
- Edit Individual KPI

Organise the form into:
1. KPI Information
2. Scoring Definition

SECTION 1: KPI INFORMATION

Fields:
- Perspective
- KRA
- KPI Name / Description
- Target
- Weightage

PERSPECTIVE

Use a dropdown with these example predefined options:
- Financial
- Customer
- Internal Process
- Learning & Growth

Add an information icon with this explanation:
“The broad performance area that the KPI contributes to.”

KRA

Use a dropdown with example predefined options:
- Company Target
- Sales Performance
- Customer Satisfaction
- Service Quality
- Staff Development

Add an information icon with this explanation:
“Key Result Area; the specific performance area that the KPI measures.”

Where appropriate, change KRA options based on Perspective:

- Financial → Company Target, Sales Performance
- Customer → Customer Satisfaction, Service Quality
- Internal Process → Service Quality
- Learning & Growth → Staff Development

Label Perspective and KRA values as:
“Example predefined values — To Be Confirmed with TBM”

Do not create a separate Perspective or KRA configuration page.

TARGET

Use an input that can support different target formats, such as:
- RM80,000
- 95%
- 4.5 out of 5
- 10 new customers per month
- Complete 3 product-learning sessions

WEIGHTAGE

Use a percentage input.

Show:
- Current total weightage
- Remaining weightage
- Resulting total after saving

SECTION 2: SCORING DEFINITION

For V2, assume employees define the achievement criteria for their own Individual-Level KPIs.

Provide separate text areas for:
- Score 5
- Score 4
- Score 3
- Score 2
- Score 1
- Score 0

Add helper text:

“Define the achievement required for each score. Your Manager will review these criteria together with the proposed KPI.”

Use this example for Personal Sales Target:
- Score 5: Achieves 110% or more of the target
- Score 4: Achieves 100%–109% of the target
- Score 3: Achieves 90%–99% of the target
- Score 2: Achieves 75%–89% of the target
- Score 1: Achieves 50%–74% of the target
- Score 0: Achieves less than 50% of the target

Clearly label the criteria as an example, not a company-wide scoring policy.

Drawer actions:
- Cancel
- Save Draft

WEIGHTAGE VALIDATION

When creating an Individual KPI:
- Calculate the total after including the new weightage.
- Prevent saving if the resulting total exceeds 100%.

When editing an Individual KPI:
- Remove its previous weightage before calculating the updated total.
- Prevent saving if the resulting total exceeds 100%.

Allow saving as Draft when the total is below 100%.

Example validation messages:
- “This weightage would increase your total KPI weightage to 105%. Reduce it by at least 5%.”
- “Your total KPI weightage is currently 90%. Add another 10% before submitting.”

Do not allow submission unless the total equals exactly 100%.

VIEW SCORING GUIDE

Retain the existing View Scoring Guide button.

Open a modal that explains the general meaning of the rating scale:

- 5 — Exceptional
- 4 — Exceeds Expectations
- 3 — Meets Expectations
- 2 — Partially Meets Expectations
- 1 — Needs Significant Improvement
- 0 — Not Achieved

Add this message:

“Actual achievement thresholds are defined separately for each KPI.”

Do not apply one general numerical threshold to every KPI.

SUBMIT INDIVIDUAL KPIS FOR APPROVAL

The action should only submit eligible Draft or Returned Individual-Level KPIs.

Company- and Department-Level KPIs must not be submitted for Manager approval.

Disable submission when:
- Total KPI weightage is below 100%
- Total KPI weightage exceeds 100%
- Required Individual KPI information is incomplete
- Any Score 0–5 criterion is missing
- There are no Draft or Returned Individual KPIs to submit

Show an inline explanation when the button is disabled.

Before submission, open a confirmation dialog showing:
- Number of Individual KPIs being submitted
- Individual-Level KPI weightage
- Overall KPI weightage
- Manager receiving the submission

Confirmation dialog actions:
- Cancel
- Submit to Manager

After submission:
- Change submitted Individual KPI statuses to Pending Manager Approval
- Make submitted KPIs read-only
- Update the KPI Plan Status
- Display this success message:

“Your Individual KPIs and their scoring definitions have been submitted to your Manager for review.”

Also display:

“Your Manager may approve the KPIs or return them to you for revision.”

RETURNED INDIVIDUAL KPI

When an Individual KPI is returned:
- Display Returned for Revision
- Display the Manager’s return reason
- Allow View
- Allow Edit
- Allow the KPI to be resubmitted

APPROVED INDIVIDUAL KPI

When an Individual KPI is approved:
- Display Approved
- Make the KPI read-only
- Explain that it is now part of the confirmed KPI plan

PROTOTYPE INTERACTIONS

Implement these interactions using local prototype state:
- Open and close KPI Detail drawer
- Open Create/Edit Individual KPI drawer
- Select Perspective
- Update KRA options
- Enter Score 0–5 criteria
- Add or edit Individual KPI weightage
- Recalculate total and remaining weightage
- Show inline validation
- Open the general Scoring Guide
- Submit Individual KPIs
- Update statuses after submission
- Display returned and approved states

Keep the interface compact, easy to scan and understandable to non-technical TBM stakeholders.