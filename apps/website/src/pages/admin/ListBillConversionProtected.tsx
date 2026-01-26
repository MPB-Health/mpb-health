import RouteGuard from "../../components/auth/RouteGuard";
import { ListBillConversion } from "../ListBillConversion";

export default function ListBillConversionProtected() {
  return (
    <RouteGuard requiredRoles={["admin", "staff"]}>
      <ListBillConversion />
    </RouteGuard>
  );
}
