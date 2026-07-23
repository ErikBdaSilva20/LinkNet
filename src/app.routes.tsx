import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";

import LandingScreen from "@/screens/LandingScreen";
import LoginScreen from "@/screens/LoginScreen";
import RegisterScreen from "@/screens/RegisterScreen";
import PublicProfileScreen from "@/screens/PublicProfileScreen";
import ShortLinkRedirectScreen from "@/screens/ShortLinkRedirectScreen";
import NotFoundScreen from "@/screens/NotFoundScreen";

import HomeScreen from "@/screens/HomeScreen";
import LinksScreen from "@/screens/LinksScreen";
import ShortLinksScreen from "@/screens/ShortLinksScreen";
import LeadFormScreen from "@/screens/LeadFormScreen";
import LeadsScreen from "@/screens/LeadsScreen";
import DesignScreen from "@/screens/DesignScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export function AppRoutes() {
  return (
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
  );
}
