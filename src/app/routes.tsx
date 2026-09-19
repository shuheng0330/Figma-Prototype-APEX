import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { ApexLayout } from "./components/ApexLayout";
import { Login } from "./components/Login";
import { SOPUpload } from "./components/SOPUpload";
import { MaterialReview } from "./components/MaterialReview";
import { QuizReview } from "./components/QuizReview";
import { StaffPortal } from "./components/StaffPortal";
import { LearningPortal } from "./components/LearningPortal";
import { CompetencyDashboard } from "./components/CompetencyDashboard";
import { UserManagement } from "./components/UserManagement";
import { OrgWideEvaluation } from "./components/OrgWideEvaluation";
import { StaffProfileHR } from "./components/StaffProfileHR";
import { StaffPerformanceDashboard } from "./components/StaffPerformanceDashboard";
import { TrainingScoreboard } from "./components/TrainingScoreboard";
import { TrainingAssignment } from "./components/TrainingAssignment";
import { MyProfile } from "./components/MyProfile";
import { TrainingCalendar } from "./components/TrainingCalendar";
import { ReviewPeriods } from "./components/ReviewPeriods";
import { ReviewPeriodSetup } from "./components/ReviewPeriodSetup";
import { MyKpiPlan } from "./components/MyKpiPlan";
import { MyAssessments } from "./components/MyAssessments";
import { TeamReviews } from "./components/TeamReviews";
import { TeamAppraisals } from "./components/TeamAppraisals";
import { DepartmentKPIs } from "./components/DepartmentKPIs";
import { CompanyKPIs } from "./components/CompanyKPIs";
import { AttitudeSetup } from "./components/AttitudeSetup";
import { FinalAppraisals } from "./components/FinalAppraisals";
import { HrAppraisalQueue } from "./components/HrAppraisalQueue";
import { HrAppraisals } from "./components/HrAppraisals";
import { SessionRegistration } from "./components/SessionRegistration";
import { TrainerDashboard } from "./components/TrainerDashboard";
import { SessionAttendance } from "./components/SessionAttendance";
import { LearningPaths } from "./components/LearningPaths";
import { IdpManagement } from "./components/IdpManagement";
import { TrainingKpi } from "./components/TrainingKpi";
import { RoleAccess } from "./components/RoleAccess";
import { SharingSessions } from "./components/SharingSessions";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "login",
        Component: Login,
      },
      {
        path: "",
        Component: ApexLayout,
        children: [
          { index: true, Component: SOPUpload },
          { path: "upload",         Component: SOPUpload                },
          { path: "review",         Component: MaterialReview           },
          { path: "quiz-review",    Component: QuizReview               },
          { path: "training-score", Component: TrainingScoreboard       },
          { path: "assign-training", Component: TrainingAssignment      },
          { path: "portal",         Component: LearningPortal           },
          { path: "profile",        Component: MyProfile                },
          { path: "dashboard",      Component: CompetencyDashboard      },
          { path: "performance",    Component: StaffProfileHR},
          { path: "users",          Component: UserManagement           },
          { path: "org-eval",       Component: OrgWideEvaluation        },
          { path: "staff-profile/:id", Component: StaffProfileHR        },
          { path: "calendar",                      Component: TrainingCalendar  },
          { path: "performance/review-periods",              Component: ReviewPeriods     },
          { path: "performance/review-periods/new",          Component: ReviewPeriodSetup },
          { path: "performance/review-periods/:id/edit",     Component: ReviewPeriodSetup },
          { path: "performance/review-periods/:id/view",     Component: ReviewPeriodSetup },
          { path: "performance/my-kpi-plan",      Component: MyKpiPlan         },
          { path: "performance/department-kpis",  Component: DepartmentKPIs    },
          { path: "performance/company-kpis",     Component: CompanyKPIs       },
          { path: "performance/attitude-setup",   Component: AttitudeSetup     },
          { path: "performance/my-assessments",   Component: MyAssessments     },
          { path: "performance/team-reviews",          Component: TeamReviews    },
          { path: "performance/final-appraisals",     Component: TeamAppraisals },
          { path: "performance/final-appraisals/:id", Component: FinalAppraisals},
          { path: "performance/hr-appraisals",        Component: HrAppraisalQueue },
          { path: "performance/hr-appraisals/:id",   Component: HrAppraisals     },

          // ── Training ──────────────────────────────────────────────────────
          { path: "register/:sessionId", Component: SessionRegistration },
          { path: "trainer-dashboard",   Component: TrainerDashboard    },
          { path: "sharing-sessions",    Component: SharingSessions     },
          { path: "attendance",          Component: SessionAttendance   },
          { path: "learning-paths",      Component: LearningPaths       },
          { path: "idp",                 Component: IdpManagement       },
          { path: "training-kpi",        Component: TrainingKpi         },
          { path: "access",              Component: RoleAccess          },
        ],
      },
    ],
  },
]);