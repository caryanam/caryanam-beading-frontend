import { ProfilePage } from "@/components/profile-page";
import { inspectorNav } from "@/components/nav-config";

export function InspectorProfile() {
  return <ProfilePage role="inspector" nav={inspectorNav} />;
}
