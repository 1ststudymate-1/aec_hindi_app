import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/access";
import { setProgressAccount } from "@/lib/progress";
import { Button } from "@/components/ui/button";

export default function RequirePaid() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.isPending || auth.isError) return (
    <section className="mx-auto max-w-3xl px-4 py-16" data-testid="access-check-state">
      <h1 className="font-heading text-2xl" data-testid="access-check-heading">आपकी अध्ययन पहुँच</h1>
      <p className="mt-4 leading-8 text-muted-foreground" data-testid="access-check-message">
        {auth.isError ? "खाते की पुष्टि नहीं हो सकी। इंटरनेट जाँचें; आपकी सामग्री सुरक्षित है।" : "आपके खाते और पैक की पुष्टि हो रही है…"}
      </p>
      {auth.isError && <Button className="mt-4" onClick={() => void auth.refetch()} data-testid="access-retry-button">फिर जाँचें</Button>}
    </section>
  );
  if (!auth.data.user?.has_access) return <Navigate to="/membership" replace state={{ from: location.pathname }} />;
  setProgressAccount(auth.data.user.user_id);
  return <Outlet />;
}