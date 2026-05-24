import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MainPage } from "./pages/main/Page";
import { SecondaryPage } from "./pages/secondary/Page";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import "./index.css";
// import { RFExamplePage } from "./pages/rfExample/page";
import { ProfilePage } from "./pages/profile/Page";
import { AuthCallbackPage } from "./pages/auth/callback/Page";
import { GraphPage, SkillListPage } from "./pages/graph-view";
import { ReportPage } from "./pages/report";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/secondary" element={<SecondaryPage />} />
        {/* <Route path="/rf_example" element={<RFExamplePage />} /> */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/graph" element={<Navigate to="/" replace />} />
        <Route path="/graph/:graphId" element={<GraphPage />} />
        <Route path="/graph/:graphId/list" element={<SkillListPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
