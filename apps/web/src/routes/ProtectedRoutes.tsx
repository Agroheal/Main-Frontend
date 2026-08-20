import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <Spinner color="green.800" />
          <div className="text-green-800">Checking authentication...</div>
        </div>
      </div>
    );

  // sessions
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
