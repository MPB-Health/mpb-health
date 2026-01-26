import RouteGuard from "../../../components/auth/RouteGuard";
import { WelcomeCallSurvey } from "../../WelcomeCallSurvey";

export default function WelcomeSurveyProtected() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <WelcomeCallSurvey />
    </RouteGuard>
  );
}
