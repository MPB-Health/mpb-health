import RouteGuard from "../../components/auth/RouteGuard";
import { ListBillSetup } from "../ListBillSetup";

export default function ListBillSetupProtected() {
  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <ListBillSetup />
    </RouteGuard>
  );
}
