import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ShieldOff } from "lucide-react";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <ShieldOff className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Denied</h2>

        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. If you believe this is an error,
          please contact support.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    </div>
  );
}
