import { ProfilePage } from "@/components/profile-page";
import { dealerNav } from "@/components/nav-config";

export function DealerProfile() {
  return <ProfilePage role="dealer" nav={dealerNav} />;
}
