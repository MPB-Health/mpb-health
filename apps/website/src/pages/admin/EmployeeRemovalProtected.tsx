import RouteGuard from "../../components/auth/RouteGuard";
import { EmployeeRemoval } from "../EmployeeRemoval";

export default function EmployeeRemovalProtected() {
  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <EmployeeRemoval />
    </RouteGuard>
  );
}
