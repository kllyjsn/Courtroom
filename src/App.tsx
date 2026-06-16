import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import DisclaimerGate from "./components/DisclaimerGate";
import Dashboard from "./pages/Dashboard";
import CaseBuilder from "./pages/CaseBuilder";
import Research from "./pages/Research";
import ArgumentPrep from "./pages/ArgumentPrep";
import Guide from "./pages/Guide";
import Hearing from "./pages/Hearing";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <DisclaimerGate>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/case" element={<CaseBuilder />} />
          <Route path="/research" element={<Research />} />
          <Route path="/arguments" element={<ArgumentPrep />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/hearing" element={<Hearing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </DisclaimerGate>
  );
}
