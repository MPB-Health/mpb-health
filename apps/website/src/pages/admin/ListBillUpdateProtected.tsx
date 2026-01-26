import RouteGuard from "../../components/auth/RouteGuard";
import { ListBillUpdate } from "../ListBillUpdate";

export default function ListBillUpdateProtected() {
  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <ListBillUpdate />
    </RouteGuard>
  );
}
