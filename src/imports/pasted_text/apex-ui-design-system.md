Design a modern enterprise web application UI for "APEX Career & Learning" — a corporate performance and training management system. Follow this exact design system:
Design System:

Background: Light grey page background (#F4F6F9)
Sidebar: White, left-fixed, narrow (with icon + label nav items)
Cards: Pure white (#FFFFFF), border-radius: 8px, subtle box shadow (0 1px 4px rgba(0,0,0,0.08))
Primary accent: Teal/green (#00C9A7) for buttons, status chips, active states
Typography: Sans-serif (Inter or similar); page titles bold ~20px, labels ~12px muted grey
Status chips: Rounded pill badges — green = Excellent/Approved, orange = Satisfactory/Pending, red = Needs Improvement/Rejected
Data bars: Horizontal colored bars with role benchmark dashed vertical line overlay
Top bar: White, breadcrumb navigation left, user avatar + name + role right


Screen 1 — SOP Upload Page (Trainer View)
Match the layout structure of the "Team Evaluation" page:

Fixed left sidebar with workspace sections: Workspace, Career, Performance, Learning — same icon + label style
Top breadcrumb: Performance / SOP Management
Page title: "Upload New SOP Document" with subtitle "Add and version-control SOP documents for AI training generation"
Evaluation cycle selector (top-right) replaced with "Department: Engineering ▾" dropdown + Export button
Info banner (blue, dismissible): "AI processing active. Uploaded SOPs will be converted into training materials within 24 hours."
Main content in white card:

Large dashed-border drop zone (center-aligned, upload icon, "Drag & drop your PDF or DOCX here", "or Browse Files" teal link)
Below drop zone: form row with fields — SOP Title (text input), Department (dropdown), Version (text input, e.g. v2.1)
Primary teal button: "Upload & Generate Training" (full-width or right-aligned)


Success banner (green, below form): "✓ SOP Uploaded Successfully — AI is generating training material. Est. ready in 20 mins."


Screen 2 — Training Material Review Page (Trainer View)
Mirror the layout of the full-page evaluation screen with a 3-column layout:

Left panel (white card, ~240px): Section title "Pending Review" with count badge. List of SOP items with pill status chips:

Orange pill = Pending
Green pill = Approved
Red pill = Rejected
Active item highlighted with teal left border + light teal background


Center panel (main white card, flex-grow): Shows AI-generated training content for selected SOP:

SOP title as page heading, department + version metadata row (muted grey)
Tabbed sections or clearly divided sections with bold headers: Overview, Key Steps (numbered list), Important Notes (yellow highlight callout box)
Scrollable content area


Right panel (white card, ~220px): Action panel titled "Review Actions"

"Approve" button — teal, full width
"Reject" button — outlined red, full width
Textarea below: "Rejection Reason (required if rejecting)" placeholder
Muted helper text: "Approved materials are immediately assigned to relevant staff"




Screen 3 — Staff Learning Portal (Staff View)
Same sidebar and top bar, but nav active state on "My Learning":

Welcome banner (white card, full width): "Hello Sarah 👋, you have 2 assigned trainings due this week" — bold name, teal count highlight, avatar right side
Training Cards grid (2-col or 3-col white cards):

Each card: Department tag (pill, teal or grey), SOP title (bold), due date (muted, Due: 30 Jun 2025), progress bar (teal fill, e.g. 60% complete), "Continue" or "Start" teal button


Quiz Screen (replaces card grid when quiz active — white card, centered, max-width ~640px):

Top: progress indicator "Question 3 of 10" with linear progress bar (teal)
SOP/module name subtitle
Question text (bold, ~18px)
4 MCQ options as selectable cards (border highlight teal on selection, radio button left)
"Submit Answer" teal button (right-aligned or full-width)
Muted "Skip" text link




Screen 4 — Team Performance Dashboard (Trainer View)
Directly mirrors the uploaded screenshot layout:

4 KPI summary cards (same style as Staff Evaluated / Best Performer / Team Average / Meeting Expectations):

Total Trained — count + "staff completed"
Avg Quiz Score — percentage + vs. last cycle delta
Pass Rate — percentage + staff scoring ≥ 70%
Needs Retraining — count + teal up/down indicator


Performance Trend chart (white card, left ~60% width): Line chart — Team Average vs Org Average, same 1Y/3Y/5Y/All toggle buttons, teal line for team
Score Distribution donut chart (white card, right ~38% width): Same donut style — Excellent / Satisfactory / Needs Improvement with legend + percentages
Team Competency bar chart (white card, full width): Horizontal bars per competency (Communication, Technical, etc.) with dashed benchmark line — same color coding (green = above, orange = at, red = below benchmark)
Full Staff Table (white card): Columns — Rank (numbered badge), Name + avatar, Department, Role, Avg Score, Latest Score, Status (pill), Trend (↑↓ with delta), Appraisal (pill), Category, Action (View Details link teal)
Filter bar above table: Department ▾, SOP ▾, Status ▾ dropdowns + Export CSV button (matches screenshot exactly)


Consistency Rules (apply to all screens):

Sidebar active item: teal text + teal left border indicator
All buttons: border-radius: 6px, teal primary / outlined secondary
All inputs/dropdowns: border-radius: 6px, 1px grey border, focus ring teal
Spacing: 24px page padding, 16px card padding, 12px between cards
No dark mode — light enterprise UI throughout
Font: Inter, system-ui fallback