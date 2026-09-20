import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Unit from "@/pages/Unit";
import TopicPage from "@/pages/TopicPage";
import Quiz from "@/pages/Quiz";
import Exam from "@/pages/Exam";
import NotFound from "@/pages/NotFound";
import RequirePaid from "@/components/RequirePaid";
import Membership from "@/pages/Membership";
import AuthCallback from "@/pages/AuthCallback";
import Syllabus from "@/pages/Syllabus";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  const location = useLocation();
  // Consume the Google callback before Layout/useAuth mounts and checks the old cookie.
  if (new URLSearchParams(location.hash.slice(1)).has("session_id")) return <AuthCallback />;
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/membership" element={<Membership />} />
          <Route path="/account" element={<Membership />} />
          <Route path="/login" element={<Navigate to="/membership" replace />} />
          <Route element={<RequirePaid />}>
          <Route path="/" element={<Home />} />
          <Route path="/ikai/:unit" element={<Unit />} />
          <Route path="/vishay/:slug" element={<TopicPage />} />
          <Route path="/abhyas" element={<Quiz />} />
          <Route path="/pariksha" element={<Exam />} />
          <Route path="/syllabus" element={<Syllabus />} />
          <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
      <Toaster richColors />
    </>
  );
}
