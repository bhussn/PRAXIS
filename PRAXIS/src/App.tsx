import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Brief from "./pages/Brief";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import Saved from "./pages/Saved";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* App routes with sidebar layout */}
        {/* AUTH: REPLACE THIS — wrap in ProtectedRoute when Supabase is connected */}
        <Route element={<AppLayout />}>
          <Route path="/brief" element={<Brief />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
