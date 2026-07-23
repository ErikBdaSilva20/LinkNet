import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ActivePageProvider } from "@/contexts/ActivePageContext";
import { ThemeProvider } from "next-themes";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Public Pages
import PublicProfile from "./pages/PublicProfile";
import ShortLink from "./pages/ShortLink";

// Dashboard Pages
import AppHome from "./pages/app/AppHome";
import LinksPage from "./pages/app/LinksPage";
import LeadsPage from "./pages/app/LeadsPage";
import DesignPage from "./pages/app/DesignPage";
import AnalyticsPage from "./pages/app/AnalyticsPage";
import SettingsPage from "./pages/app/SettingsPage";
import ShortLinksPage from "./pages/app/ShortLinksPage";
import FormPage from "./pages/app/FormPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <ActivePageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<Register />} />
              
              {/* Public Profile - with optional page slug */}
              <Route path="/:handle" element={<PublicProfile />} />
              <Route path="/:handle/:pageSlug" element={<PublicProfile />} />
              
              {/* Short Links */}
              <Route path="/l/:slug" element={<ShortLink />} />

              {/* Dashboard Routes (Protected) */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/links"
                element={
                  <ProtectedRoute>
                    <LinksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/leads"
                element={
                  <ProtectedRoute>
                    <LeadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/design"
                element={
                  <ProtectedRoute>
                    <DesignPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/shortlinks"
                element={
                  <ProtectedRoute>
                    <ShortLinksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/app/form"
                element={
                  <ProtectedRoute>
                    <FormPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </ActivePageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
