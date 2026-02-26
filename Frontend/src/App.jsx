import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import Layout from "@/components/layout"
import CandidateComparisonPage from "@/pages/CandidateComparisonPage"
import CandidateProfilePage from "@/pages/CandidateProfilePage"
import CandidateRankingPage from "@/pages/CandidateRankingPage"
import DashboardPage from "@/pages/DashboardPage"
import EmptyAndLoadingStatesPage from "@/pages/EmptyAndLoadingStatesPage"
import JobManagementPage from "@/pages/JobManagementPage"
import RegisterPage from "@/pages/RegisterPage"
import SignInPage from "@/pages/SignInPage"
import UploadAndScreeningPage from "@/pages/UploadAndScreeningPage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobManagementPage />} />
          <Route path="/upload-screening" element={<UploadAndScreeningPage />} />
          <Route path="/candidates/ranking" element={<CandidateRankingPage />} />
          <Route path="/candidates/profile" element={<CandidateProfilePage />} />
          <Route path="/candidates/comparison" element={<CandidateComparisonPage />} />
          <Route path="/states" element={<EmptyAndLoadingStatesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
