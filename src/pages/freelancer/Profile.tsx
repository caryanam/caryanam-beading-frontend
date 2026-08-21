import { ProfilePage } from "@/components/profile-page";
import { freelancerNav } from "@/components/nav-config";

export function FreelancerProfile() {
  return <ProfilePage role="freelancer" nav={freelancerNav} />;
}
