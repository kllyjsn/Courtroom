import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import DisclaimerGate from "./components/DisclaimerGate";
import Dashboard from "./pages/Dashboard";
import CaseBuilder from "./pages/CaseBuilder";
import Research from "./pages/Research";
import CaseTheory from "./pages/CaseTheory";
import ArgumentPrep from "./pages/ArgumentPrep";
import Deadlines from "./pages/Deadlines";
import Guide from "./pages/Guide";
import Hearing from "./pages/Hearing";
import MockHearing from "./pages/MockHearing";
import Settings from "./pages/Settings";
import { Spinner } from "./components/common";

// Heavy pages (pdfjs / tesseract / pdf-lib) are split out of the initial bundle.
const Documents = lazy(() => import("./pages/Documents"));
const Forms = lazy(() => import("./pages/Forms"));

function PageFallback() {
  return (
    <div className="p-4">
      <Spinner label="Loading…" />
    </div>
  );
}

export default function App() {
  return (
    <DisclaimerGate>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/case" element={<CaseBuilder />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/research" element={<Research />} />
            <Route path="/theory" element={<CaseTheory />} />
            <Route path="/arguments" element={<ArgumentPrep />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/deadlines" element={<Deadlines />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/hearing" element={<Hearing />} />
            <Route path="/mock" element={<MockHearing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </DisclaimerGate>
  );
}
