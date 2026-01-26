import RouteGuard from "../../../components/auth/RouteGuard";
import { ReviewOrChangeAdvisor } from "../../ReviewOrChangeAdvisor";

export default function ChangeAdvisorProtected() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <ReviewOrChangeAdvisor />
    </RouteGuard>
  );
}
