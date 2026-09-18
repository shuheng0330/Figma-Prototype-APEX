# Figma Make Implementation Prompt

```text
Extend the existing APEX Corporate Training UI by adding a Staff Appraisal and KPI Tracking prototype.

IMPORTANT
- Preserve all existing screens, routes, components and functionality.
- Do not redesign or remove the current Training module.
- Inspect and reuse the existing APEX design language before creating new elements.
- Reuse ApexLayout, ApexSidebar, ApexHeader and existing Card, Table, Tabs, Badge, Drawer, Dialog, Progress, Input, Select, Textarea and Button patterns.
- Use mock data and local state only. No backend integration is required.
- Keep the interface simple enough for non-technical TBM stakeholders.

DESIGN LANGUAGE
Prioritise existing project tokens and styles. Where no existing token is available, use:
- Font: Open Sans
- Page background: #F4F6F9
- Primary blue: #2457A6
- Success teal: #0F9F8F
- Warning amber: #D99000
- Error red: #D14343
- Main text: #172033
- Muted text: #667085
- Borders: #DCE3EC
- TBM red #E2183D only as a brand accent
- White cards with subtle borders, soft shadows and 8px corner radius
- 24px page spacing and compact, clearly labelled forms
- Never communicate a status using colour alone; include a text label or icon

NAVIGATION
Add or extend a sidebar section named “Staff Performance” with:
- Review Periods
- My KPI Plan
- My Assessments
- Team Reviews
- Final Appraisals
- HR Appraisal Review

Provide a small “Demo Role” selector in the header for Employee, Manager and HR/Super Admin. Clearly mark it “Prototype only”.

SAMPLE PERSONA
- Employee: Amir Hassan
- Staff ID: RS-1042
- Role: Retail Sales Executive
- Department: Retail Sales
- Manager: Sales Manager
- Review period: 2027 Annual KPI Review
- Role-Based Review Frequency: Monthly

Treat all figures and policies as examples for validation. Display an “Example Configuration” badge where appropriate.

CREATE THESE SIX SCREENS

1. ANNUAL KPI REVIEW SETUP — SUPER ADMIN
Route: /performance/review-periods
- Page title, breadcrumb and Draft/Upcoming/Active/Closed status badge.
- General settings: period name, start date, end date and eligible staff group.
- Role frequency section showing Retail Sales = Monthly.
- Deadline settings for KPI setup, Self-Assessment, Manager Review, Attitude Evaluation, Manager Recommendation and HR Finalisation.
- KPI allocation: Company 15%, Department 25%, Individual 60%.
- Final score allocation: KPI Performance 50%, Attitude Evaluation 50%.
- Show totals and prevent each allocation from exceeding or falling below 100%.
- Actions: Save Draft, Preview Configuration and Publish Review Period.
- Include plain helper text explaining what each section controls.

2. MY KPI PLAN — EMPLOYEE
Route: /performance/my-kpi-plan
- Display Amir’s profile, review period, monthly frequency and KPI-plan status.
- Show one table containing Company-, Department- and Individual-Level KPIs.
- Columns: KPI Level, KPI Name, Target, Weightage, Data Source and Approval Status.
- Example KPIs should total 100%.
- Clearly distinguish “System-Provided” and “Manual Entry” using badges.
- System-provided examples must be read-only and labelled “Example source: POS Database — To Be Confirmed”.
- Include a progress bar showing total KPI weightage.
- Actions: Add Individual KPI, Edit Draft KPI, Submit KPI Plan and View Scoring Guide.
- Use a drawer for creating/editing an Individual-Level KPI.
- After submission, show “Pending Manager Approval” and a short “What happens next?” message.

3. MY ASSESSMENTS — EMPLOYEE
Route: /performance/my-assessments
- Use two tabs: “Monthly KPI Assessment” and “Annual Attitude Self-Assessment”.
- KPI tab: Review Checkpoint selector, deadline, submission status and KPI table.
- Show KPI target, current achievement, data source, Self-Assessment Score, comment and evidence.
- System-provided achievements are locked. Manual achievements are editable.
- Example: Monthly Sales Target = RM80,000; achievement = RM76,000; source = System-Provided.
- Provide clear 0–5 score descriptions instead of showing numbers alone.
- Attitude tab: TBM Core Values criteria, 1–5 scale, Self-Assessment Score and optional comment.
- Actions: Save Draft, Upload Evidence, Review Submission and Submit Assessment.
- Use a confirmation dialog explaining that the Manager will review the submission.

4. TEAM REVIEW WORKSPACE — MANAGER
Route: /performance/team-reviews
- Show a filterable review queue instead of a complicated dashboard.
- Filters: Review Type, Review Checkpoint, Status and Employee.
- Queue types: Individual KPI Approval, KPI Assessment and Attitude Evaluation.
- Columns: Employee, Review Type, Checkpoint, Due Date, Status and Action.
- Selecting Amir opens a review drawer or detail panel.
- Display the employee’s submission, data source, evidence and Self-Assessment Score beside the Manager’s Superior Assessment Score.
- Actions: Approve KPI, Complete Review or Return for Revision.
- Return for Revision requires a clear reason.
- A score difference alone should not automatically return an assessment.
- Show status changes such as Pending Review, Returned for Revision and Completed.

5. FINAL APPRAISAL RECOMMENDATION — MANAGER
Route: /performance/final-appraisals
- Display KPI Performance Score, Attitude Evaluation Score and Final Appraisal Score.
- Example scores: KPI 78.4, Attitude 82.0, Final 80.2 using an example 50/50 allocation.
- Clearly mark the final calculation as “Example — To Be Confirmed with TBM”.
- Include a simple 3–5-year line chart and current-year summary.
- Add appraisal decision options: Promotion, Salary Increment, Both and No Recommendation.
- Include Manager Comments and an optional structured AI Appraisal Insight.
- AI output must use fixed sections: Strengths, Areas for Improvement, Performance Trend, Supporting Evidence and Policy Considerations.
- AI must refer to displayed KPI data and must not make the final decision.
- Actions: Generate Insight, Save Draft and Submit to HR.
- Show a confirmation dialog and explain what HR will review next.

6. HR APPRAISAL REVIEW
Route: /performance/hr-appraisals
- Display Amir’s scores, trend, Manager comments, AI insight and original Manager recommendation.
- Add a small provisional organisation score-distribution chart for context, labelled “Dashboard content to be validated”.
- HR actions: Approve, Override and Approve, or Return for Revision.
- Override and Approve requires a Final Decision and Override Reason.
- Return for Revision requires a reason.
- Always preserve and display the original Manager recommendation after an override.
- HR approval confirms the appraisal record; it must not imply that promotion or salary increment has automatically been executed.
- Show a clear success state after finalisation.

PROTOTYPE INTERACTIONS
- Make sidebar navigation, tabs, filters, drawers, dialogs and primary actions clickable.
- Simulate status changes using local state.
- Add “What happens next?” guidance after major submissions.
- Use action-specific labels such as “Submit to Manager” rather than vague labels such as “Continue”.
- Add confirmation dialogs for publishing, submitting, approving, overriding and returning.
- Ensure the complete walkthrough works:
  Review Setup → KPI Plan → Employee Assessment → Manager Review → Final Recommendation → HR Finalisation.

DO NOT BUILD YET
- Full Employee, Team or Organisation dashboards
- Separate Company-Level and Department-Level KPI creation pages
- Attitude Criteria Configuration
- AI template administration
- Backend APIs, authentication or database integration
- Any unconfirmed TBM scoring formula

The finished prototype should prioritise clarity, consistent APEX styling and stakeholder validation over technical completeness.
```
