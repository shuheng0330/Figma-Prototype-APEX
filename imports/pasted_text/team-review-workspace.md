

Refine only Screen 4, “Team Review Workspace”, in the existing APEX Staff Appraisal and KPI Tracking prototype.





Use the current Team Review Workspace as the direct base. Preserve the existing APEX sidebar, header, page layout, filters, table styling, badges, colours, typography and overall visual language.





Do not modify other Staff Performance screens.





V2 OBJECTIVE





Improve the Manager’s review workspace by:





1. Adding useful sorting controls.



2. Removing all Data Source information.



3. Fixing the clipped Review drawer.



4. Keeping the main task table concise.



5. Providing review-type-specific information and actions.



6. Ensuring Managers review KPI-specific Score 0–5 definitions.





PAGE INFORMATION





Route:



 /performance/team-reviews





Primary user:



 Manager





Sample context:



- Manager view



- Department: Retail Sales



- Review period: 2027 Annual KPI Review



- Employee example: Amir Hassan



- Role: Retail Sales Executive





PAGE HEADER





Retain:



- Breadcrumb: Staff Performance > Team Reviews



- Page title: Team Review Workspace



- Review period



- Department





Add a short description:





“Review Individual KPI proposals, KPI Self-Assessments and Attitude Evaluations submitted by your team.”





FILTERS AND SORTING





Retain the existing filters:



- Review Type



- Status



- Employee



- Clear





Review Type options:



- All



- Individual KPI Approval



- KPI Assessment



- Attitude Evaluation





Status options:



- All



- Pending Review



- Returned for Revision



- Completed



- Overdue





Add sorting controls for:



- Due Date



- Status





Recommended design:



- Make the Due Date and Status table headers sortable.



- Show a clear up or down arrow beside the active sort.



- Only one primary sort needs to be active at a time.





Due Date sorting:



- Earliest first



- Latest first





Status sorting:



- Action Required first



- Completed first





For “Action Required first”, prioritise:



1. Overdue



2. Pending Review



3. Returned for Revision



4. Completed





Use local prototype state to update the visible row order.





MAIN TEAM REVIEW TABLE





Keep the table concise.





Use these columns:



- Employee



- Review Type



- Review Checkpoint



- Due Date



- Status



- Action





Do not add:



- Perspective



- KRA



- Scoring Definition



- Target



- Weightage



- Scores



- Evidence





These details belong inside the Review drawer.





Remove all Data Source information from this screen, including:



- Data Source columns



- System-Provided badges



- Manual Entry badges



- Database labels



- Source descriptions





Use a clear Review or View action for each row.





Suggested action labels:



- Pending Review → Review



- Returned for Revision → View



- Completed → View Result



- Overdue → Review





Selecting a row or its action should open the appropriate Review drawer.





REVIEW DRAWER: RESPONSIVE LAYOUT





Fix the current drawer because its table, score controls and text are clipped.





Desktop drawer requirements:



- Use a wider responsive drawer.



- Recommended width: approximately 65–70% of the viewport.



- Maximum width: approximately 1100px.



- Minimum practical width: approximately 760px.





Smaller-screen requirements:



- Use full viewport width when there is insufficient space.



- Stack content vertically instead of forcing horizontal scrolling.





Drawer layout:



1. Sticky header



2. Scrollable content area



3. Sticky bottom action bar





The drawer header should remain visible while scrolling.





The bottom action bar must always remain visible and must not overlap the content.





The content area must include sufficient bottom padding so the final section is not hidden behind the action bar.





Do not use an overly wide internal table that causes clipping.





Prefer:



- Responsive KPI review cards



- Stacked sections



- Compact comparison layouts





Avoid horizontal scrolling wherever possible.





DRAWER HEADER





Display:



- Review Type



- Employee name



- Role



- Review Checkpoint



- Due Date



- Current status



- Close button





Example:



KPI Assessment



Amir Hassan · January 2027 Review Checkpoint



Status: Pending Review



Due: 25 January 2027





DRAWER CONTENT BY REVIEW TYPE





The drawer must change its content and actions according to:





1. Individual KPI Approval



2. KPI Assessment



3. Attitude Evaluation





REVIEW TYPE 1: INDIVIDUAL KPI APPROVAL





Purpose:



Allow the Manager to review the employee’s proposed Individual-Level KPIs and their scoring definitions before approval.





Display an introductory message:





“Review the KPI details and Score 0–5 achievement criteria before approving or returning the KPI.”





For each submitted Individual-Level KPI, display a separate review card or expandable section.





Show:



- Perspective



- KRA



- KPI Name / Description



- Target



- Weightage



- Review Period



- Submission status





Do not show Data Source.





SCORING DEFINITION





Display the complete employee-defined Scoring Definition prominently within each KPI review card.





Show:



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





Add helper text:





“These criteria will be used by both the employee and Manager during KPI assessment.”





INDIVIDUAL KPI APPROVAL ACTIONS





For each KPI, provide:



- Approve KPI



- Return for Revision





If Return for Revision is selected:



- Open a dialog



- Require a return reason



- Clearly identify which KPI is being returned





Example return reason:



“Please clarify how Customer Acquisition will be measured and revise the Score 3 criteria.”





Returned KPI status:



- Returned for Revision





Approved KPI status:



- Approved





When all submitted KPIs have been reviewed, enable:



“Complete Approval Review”





Show a summary before completion:



- Number approved



- Number returned



- Total Individual KPI weightage





Treat per-KPI approval as a prototype assumption that can be revised after stakeholder validation.





REVIEW TYPE 2: KPI ASSESSMENT





Purpose:



Allow the Manager to review the employee’s Self-Assessment and enter the Superior Assessment Score for each KPI.





Do not use the existing clipped horizontal table.





Display each KPI as a responsive review card or compact vertical section.





For each KPI, show:



- KPI Name



- KPI Level badge



- Target

 

- Employee Self-Assessment Score



- Employee comment



- Attached evidence



- View Scoring Definition



- Superior Assessment Score



- Manager comment, where appropriate





Do not prominently display:



- Perspective



- KRA





Perspective and KRA may remain available through a secondary View KPI Details action if needed.





Do not display any Data Source information.





EMPLOYEE SELF-ASSESSMENT





Display the employee’s selected Score from 0–5.





Show both:



- Numeric score



- Conceptual label





Examples:



- 5 — Exceptional



- 4 — Exceeds Expectations



- 3 — Meets Expectations



- 2 — Partially Meets Expectations



- 1 — Needs Significant Improvement



- 0 — Not Achieved





Display the employee’s comment below the score.





EVIDENCE





Display attached evidence under the relevant KPI.





Show:



- File icon



- Filename



- File size



- View action





Example:



january-sales-report.pdf



2.4 MB



View





Selecting View should open a simple evidence preview or file-information dialog.





Do not add evidence-upload controls for the Manager.





VIEW SCORING DEFINITION





Provide a View Scoring Definition action for every KPI.





Selecting it should open a modal or expandable section showing:



- Score 5 criteria



- Score 4 criteria



- Score 3 criteria



- Score 2 criteria



- Score 1 criteria



- Score 0 criteria





These must be the same KPI-specific definitions used during the employee’s Self-Assessment.





Add:





“Use these criteria when selecting the Superior Assessment Score.”





SUPERIOR ASSESSMENT SCORE





Use a Score 0–5 selector:





0 | 1 | 2 | 3 | 4 | 5





Requirements:



- Only one score may be selected per KPI.



- Clearly highlight the selected score.



- Display the conceptual score label.



- Keep all six score options visible.



- Do not clip the controls.





Allow the Manager’s score to differ from the employee’s score.





Do not automatically return an assessment because the scores differ.





Retain this guidance:





“A score difference alone does not require returning an assessment. Use Return for Revision only when the submission contains incorrect information or insufficient supporting details.”





MANAGER COMMENT





Provide a Manager Comment field for each KPI.





If the Manager’s score differs significantly from the employee’s score, show a non-blocking suggestion:





“Consider adding a comment to explain the score difference.”





Do not make this mandatory unless later confirmed by TBM.





KPI ASSESSMENT ACTIONS





Sticky footer actions:



- Save Draft



- Return for Revision



- Complete Review





Complete Review should only be enabled when every KPI has a Superior Assessment Score from 0–5.





If Return for Revision is selected:



- Open a dialog



- Require a return reason



- Explain that the employee will be able to edit and resubmit the assessment





Before completing the review, show a confirmation summary:



- Employee



- Review Checkpoint



- Number of KPIs reviewed



- Average or calculated result only if already supported by the current prototype



- Number of Manager comments





Do not invent a new scoring formula.





After completion:



- Change status to Completed



- Make the review read-only



- Display a success message





REVIEW TYPE 3: ATTITUDE EVALUATION





Retain the existing Attitude Evaluation review behaviour from V1.





Apply the same drawer improvements:



- Wider responsive layout



- No clipped score controls



- Scrollable body



- Sticky header



- Sticky bottom actions





Do not introduce new attitude categories or scoring formats in this V2 task.





Use the employee’s applicable format:



- Manager



- Sales



- Others





For Amir Hassan, use:



Sales





Retain the existing attitude criteria and rating scale.





COMPLETED REVIEW STATE





When opening a Completed task:



- Open the drawer in read-only mode



- Show submitted employee scores



- Show Superior Assessment Scores



- Show Manager comments



- Show completion date



- Hide editing controls



- Replace action buttons with Close





RETURNED FOR REVISION STATE





When opening a Returned task:



- Display the return reason



- Display the date returned



- Keep the Manager review read-only until the employee resubmits



- Clearly show “Waiting for Employee Resubmission”





PROTOTYPE INTERACTIONS





Implement using local prototype state:





- Filter review tasks



- Sort by Due Date



- Sort by Status



- Open the correct drawer for each Review Type



- Expand and collapse Individual KPI details



- Review employee-defined Score 0–5 criteria



- Approve or return an Individual KPI



- Open KPI-specific Scoring Definition



- View employee evidence



- Select Superior Assessment Scores from 0–5



- Enter Manager comments



- Save a Manager review draft



- Return an assessment with a mandatory reason



- Complete a review



- Display read-only Completed and Returned states



- Keep drawer header and footer visible while scrolling





Keep the interface concise, responsive and understandable to non-technical TBM stakeholders.