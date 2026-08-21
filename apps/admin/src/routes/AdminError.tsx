import { useNavigate, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("Admin route error:", error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An unexpected error occurred while loading the admin console.
        </p>
      </div>
      <Button onClick={() => navigate("/", { replace: true })}>Back to Dashboard</Button>
    </div>
  );
}
