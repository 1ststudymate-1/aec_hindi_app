import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Unit from "@/pages/Unit";
import TopicPage from "@/pages/TopicPage";
import Quiz from "@/pages/Quiz";
import Exam from "@/pages/Exam";
import NotFound from "@/pages/NotFound";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/ikai/:unit" element={<Unit />} />
          <Route path="/vishay/:slug" element={<TopicPage />} />
          <Route path="/abhyas" element={<Quiz />} />
          <Route path="/pariksha" element={<Exam />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster richColors />
    </>
  );
}
