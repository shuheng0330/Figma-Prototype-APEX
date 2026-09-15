Create one new HR / Super Admin screen: “Attitude Evaluation Setup”.

IMPORTANT:
- Use the existing APEX Staff Performance design system and reuse existing components.
- Make the screen simple and easy for non-technical stakeholders to understand.
- This page configures Attitude Evaluation only.
- Each Annual KPI Review Period has its own Attitude Evaluation configuration.
- Do NOT use configuration version numbers such as v1/v2.
- Attitude Evaluation Configuration should probably be a reusable master configuration, not something HR must publish separately for every Annual KPI Review Period. 

1. HEADER

Title:
Attitude Evaluation Setup

Subtitle:
Configure attitude evaluation forms, criteria and role assignments.

Show:
- Configuration Status: Draft / Published
- Review Period Status
- Last Updated

Example:
2027 Annual KPI Review
Configuration: Published
Review Period: Open

Actions when editable:
- Preview Forms
- Save Draft
- Publish Configuration

Show information message:
“Changes apply to this Annual KPI Review Period only. Once the Review Period opens, this configuration becomes read-only.”

2. REVIEW PERIOD BEHAVIOUR

Each Annual KPI Review Period maintains its own Attitude Evaluation configuration.

For a new Review Period:
- Copy the previous Review Period’s Attitude Evaluation configuration as the starting configuration.
- HR can then edit it for the new period.

Before Review Period = Open:
- Configuration is editable.
- HR can Save Draft or Publish.
- A Published configuration may still be edited and republished before the Review Period opens.

When Review Period = Open:
- Lock the configuration.
- Make all configuration fields read-only.
- Show:
  “This configuration is locked because the Annual KPI Review Period has opened.”

Closed Review Period:
- Historical configuration remains available as read-only.

3. RATING SCALE

Section:
Rating Scale

Helper text:
“This rating scale is shared across all Attitude Evaluation formats.”

Use fixed numeric scores:

5 — Exceptional
4 — Exceeding Expectations
3 — Meets Expectations
2 — Needs Improvement
1 — Unsatisfactory

Show:
- Score
- Label
- Description
- Edit

HR may edit Label and Description.
Numeric scores 1–5 are fixed.

Do NOT add Score 0.

Show note:
“Attitude Evaluation Score calculation is To Be Confirmed with TBM.”

4. EVALUATION FORMATS

Section:
Evaluation Formats

Use 3 tabs:
- Manager
- Sales
- Others / Non-Sales

Manager:
10 Shared Core Values + 6 Additional Manager Criteria

Sales:
10 Shared Core Values

Others / Non-Sales:
10 Shared Core Values

Use “Others / Non-Sales” until the official name is confirmed.

5. SHARED CORE VALUES

Under the selected format show:
Shared Core Values

Helper text:
“These criteria are shared across all three evaluation formats.”

Use these 10 criteria:
1. Respect
2. Integrity
3. Taking Initiative
4. Thoughtfulness
5. Cooperation
6. Effective Communication
7. Proactive in Learning
8. Willingness to Try
9. Wholeheartedness
10. Positivity

Table columns:
- Order
- Criterion
- Description
- Required
- Status
- Actions

Criterion Status:
- Active
- Inactive

Actions:
- View
- Edit
- Reorder
- Set as Inactive

For an Inactive criterion, allow:
- View
- Set as Active

Add:
+ Add Core Value

Do not permanently delete criteria that have already been used in assessments.

6. ADDITIONAL MANAGER CRITERIA

Show only when the Manager tab is selected.

Title:
Additional Manager Criteria

Helper text:
“Additional leadership criteria for employees assigned to the Manager format.”

Use:
1. Strategic Focus
2. Management Effectiveness
3. Problem Solving and Prevention
4. Leadership and Empowerment
5. Creativity and Simplicity
6. Win-Win Mentality

Use the same table structure as Shared Core Values.

Add:
+ Add Manager Criterion

Do not show this section for Sales or Others / Non-Sales.

7. ADD / EDIT CRITERION

Open a right-side drawer.

Fields:
- Criterion Name
- Description
- Criterion Type
- Required
- Display Order
- Status

Criterion Type:
- Shared Core Value
- Manager-Specific Criterion

If Shared Core Value:
Show read-only:
Applies to: Manager, Sales, Others / Non-Sales

If Manager-Specific Criterion:
Show read-only:
Applies to: Manager

Actions:
- Cancel
- Save Criterion

Do not add criterion weightage.

8. ROLE-TO-FORMAT ASSIGNMENT

Section:
Role-to-Format Assignment

Helper text:
“Choose which Attitude Evaluation format each employee role should use.”

Table columns:
- Department
- Role
- Assigned Format
- Status
- Action

Format options:
- Manager
- Sales
- Others / Non-Sales

Prototype mappings:
- Branch Manager → Manager
- Head of Department → Manager
- Retail Sales Executive → Sales
- Customer Service Officer → Others / Non-Sales
- Service Centre Admin → Others / Non-Sales

Show:
“Sample role mappings for stakeholder validation.”

Managerial roles should use the Manager format even when they belong to a Sales department.

9. PREVIEW FORMS

“Preview Forms” opens a large drawer/modal.

Title:
Attitude Evaluation Preview

Controls:
Format:
- Manager
- Sales
- Others / Non-Sales

Perspective:
- Employee Self-Assessment
- Superior Evaluation

Preview:
- Criterion Name
- Description
- Score selector 1–5
- Rating scale reference
- Comment field

Manager preview:
Shared Core Values
+
Additional Manager Criteria

The preview should visually match the Attitude Evaluation forms used in My Assessments and Team Reviews.

10. PUBLISHING

Configuration statuses:
- Draft
- Published

Save Draft:
- Saves configuration without making it ready for use.

Publish Configuration:
- Confirms the Attitude Evaluation configuration for the selected Annual KPI Review Period.
- Includes Rating Scale, Evaluation Formats, Criteria and Role-to-Format Assignments.

Do not create user-facing configuration versions.

Once the Review Period becomes Open, its published configuration is locked and preserved for historical consistency.


Keep the page visually clear.

The main relationship should be easy to understand:

Rating Scale
→ Evaluation Formats
→ Criteria
→ Role-to-Format Assignment
→ Actual Attitude Evaluation Forms

