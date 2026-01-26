import RouteGuard from "../../../components/auth/RouteGuard";
import { ReviewUs } from "../../ReviewUs";

export default function ReviewUsProtected() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <ReviewUs />
    </RouteGuard>
  );
}
