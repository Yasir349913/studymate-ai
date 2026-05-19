import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
