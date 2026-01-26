import RouteGuard from "../../../components/auth/RouteGuard";
import { ScheduleWelcomeCall } from "../../ScheduleWelcomeCall";

export default function WelcomeCallProtected() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <ScheduleWelcomeCall />
    </RouteGuard>
  );
}
