import RouteGuard from "../../../components/auth/RouteGuard";
import { ReferAFriend } from "../../ReferAFriend";

export default function ReferFriendProtected() {
  return (
    <RouteGuard requiredRoles={["member", "advisor", "admin", "staff"]}>
      <ReferAFriend />
    </RouteGuard>
  );
}
