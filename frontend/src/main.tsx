import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MainPage } from "./pages/main/Page";
import { SecondaryPage } from "./pages/secondary/Page";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { RFExamplePage } from "./pages/rfExample/page";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/secondary" element={<SecondaryPage />} />
        <Route path="/rf_example" element={<RFExamplePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
