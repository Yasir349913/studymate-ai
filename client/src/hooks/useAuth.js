import { useAuthStore } from "@/store/auth.store";
import { authAPI } from "@/api/auth.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useAuth() {
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Error ignore karo — logout anyway
    } finally {
      storeLogout();
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  return { user, logout };
}
