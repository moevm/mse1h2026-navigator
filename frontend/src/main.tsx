import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MainPage } from "./pages/main/Page";
import { SecondaryPage } from "./pages/secondary/Page";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { ProfilePage } from "./pages/profile/Page";
import { AuthCallbackPage } from "./pages/auth/callback/Page";
import { GraphPage } from "./pages/graph-view";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/secondary" element={<SecondaryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
