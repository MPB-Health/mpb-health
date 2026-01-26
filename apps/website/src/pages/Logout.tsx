import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "../lib/auth";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        navigate("/");
      } catch (error) {
        console.error("Logout error:", error);
        navigate("/");
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you out...</p>
      </div>
    </div>
  );
}
