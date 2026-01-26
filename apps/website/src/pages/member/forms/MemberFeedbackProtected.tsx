import RouteGuard from "../../../components/auth/RouteGuard";
import { MemberFeedback } from "../../MemberFeedback";

export default function MemberFeedbackProtected() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <MemberFeedback />
    </RouteGuard>
  );
}
