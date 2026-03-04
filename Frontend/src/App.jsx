import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import CandidateComparisonPage from "@/pages/CandidateComparisonPage";
import CandidateRankingPage from "@/pages/CandidateRankingPage";
import DashboardPage from "@/pages/DashboardPage";
import EmptyAndLoadingStatesPage from "@/pages/EmptyAndLoadingStatesPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import JobManagementPage from "@/pages/JobManagementPage";
import ProfilePage from "@/pages/ProfilePage";
import RegisterPage from "@/pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SignInPage from "@/pages/SignInPage";
import UploadAndScreeningPage from "@/pages/UploadAndScreeningPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import { Toaster } from "react-hot-toast";
import { AuthContextPrivider } from "./context/authContext";

function App() {
  return (
    <BrowserRouter>
      <Toaster toastOptions={{ duration: 4000 }} />
      <AuthContextPrivider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<SignInPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/jobs" element={<JobManagementPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/upload-screening"
                element={<UploadAndScreeningPage />}
              />
              <Route
                path="/candidates/ranking"
                element={<CandidateRankingPage />}
              />
              <Route
                path="/candidates/comparison"
                element={<CandidateComparisonPage />}
              />
              <Route path="/states" element={<EmptyAndLoadingStatesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthContextPrivider>
    </BrowserRouter>
  );
}

export default App;
