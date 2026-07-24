import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

const LandingScreen = lazy(() => import("@/screens/LandingScreen"));
const LoginScreen = lazy(() => import("@/screens/LoginScreen"));
const RegisterScreen = lazy(() => import("@/screens/RegisterScreen"));
const PublicProfileScreen = lazy(() => import("@/screens/PublicProfileScreen"));
const ShortLinkRedirectScreen = lazy(() => import("@/screens/ShortLinkRedirectScreen"));
const NotFoundScreen = lazy(() => import("@/screens/NotFoundScreen"));

const HomeScreen = lazy(() => import("@/screens/HomeScreen"));
const LinksScreen = lazy(() => import("@/screens/LinksScreen"));
const ShortLinksScreen = lazy(() => import("@/screens/ShortLinksScreen"));
const LeadFormScreen = lazy(() => import("@/screens/LeadFormScreen"));
const LeadsScreen = lazy(() => import("@/screens/LeadsScreen"));
const DesignScreen = lazy(() => import("@/screens/DesignScreen"));
const AnalyticsScreen = lazy(() => import("@/screens/AnalyticsScreen"));
const SettingsScreen = lazy(() => import("@/screens/SettingsScreen"));

// Fallback do code-splitting por rota (React.lazy) — cada tela vira um chunk próprio no
// build em vez de tudo num bundle só (ver docs/auditoria-refactor/01, item P3).
function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />

        <Route path="/:handle" element={<PublicProfileScreen />} />
        <Route path="/l/:slug" element={<ShortLinkRedirectScreen />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<HomeScreen />} />
          <Route path="links" element={<LinksScreen />} />
          <Route path="shortlinks" element={<ShortLinksScreen />} />
          <Route path="form" element={<LeadFormScreen />} />
          <Route path="leads" element={<LeadsScreen />} />
          <Route path="design" element={<DesignScreen />} />
          <Route path="analytics" element={<AnalyticsScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>

        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Suspense>
  );
}
