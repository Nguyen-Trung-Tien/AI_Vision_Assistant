import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Loading from "./components/ui/Loading";
import AuthenticatedLayout from "./components/layout/AuthenticatedLayout";

const DashboardV2 = lazy(() => import("./pages/DashboardV2"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SosPage = lazy(() => import("./pages/SosPage"));
const HeatmapPage = lazy(() => import("./pages/HeatmapPage"));
const BroadcastPage = lazy(() => import("./pages/BroadcastPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ModelManagerPage = lazy(() => import("./pages/ModelManagerPage"));
const ActivityLogPage = lazy(() => import("./pages/ActivityLogPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SystemPage = lazy(() => import("./pages/SystemPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function PageSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full py-32">
          <Loading size="lg" text="Đang tải trang..." />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthenticatedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <PageSuspense>
            <DashboardV2 />
          </PageSuspense>
        ),
      },
      {
        path: "analytics",
        element: (
          <PageSuspense>
            <AnalyticsPage />
          </PageSuspense>
        ),
      },
      {
        path: "sos",
        element: (
          <PageSuspense>
            <SosPage />
          </PageSuspense>
        ),
      },
      {
        path: "heatmap",
        element: (
          <PageSuspense>
            <HeatmapPage />
          </PageSuspense>
        ),
      },
      {
        path: "broadcast",
        element: (
          <PageSuspense>
            <BroadcastPage />
          </PageSuspense>
        ),
      },
      {
        path: "feedback",
        element: (
          <PageSuspense>
            <FeedbackPage />
          </PageSuspense>
        ),
      },
      {
        path: "users",
        element: (
          <PageSuspense>
            <UsersPage />
          </PageSuspense>
        ),
      },
      {
        path: "model-manager",
        element: (
          <PageSuspense>
            <ModelManagerPage />
          </PageSuspense>
        ),
      },
      {
        path: "activity",
        element: (
          <PageSuspense>
            <ActivityLogPage />
          </PageSuspense>
        ),
      },
      {
        path: "notifications",
        element: (
          <PageSuspense>
            <NotificationsPage />
          </PageSuspense>
        ),
      },
      {
        path: "system",
        element: (
          <PageSuspense>
            <SystemPage />
          </PageSuspense>
        ),
      },
      {
        path: "settings",
        element: (
          <PageSuspense>
            <SettingsPage />
          </PageSuspense>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
