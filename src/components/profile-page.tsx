import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/app-shell";
import { Panel } from "@/components/premium";
import { readSession, type Session } from "@/lib/session";
import type { Role } from "@/lib/mock-data";
import {
  getInspectorProfile,
  updateInspectorProfile,
  changeInspectorPassword,
  getMyInspections,
} from "@/lib/api/inspector-api";
import {
  getDealerProfile,
  updateDealerProfile,
  changeDealerPassword as changeDealerPasswordApi,
} from "@/lib/api/dealer-api";

export function ProfilePage({ role, nav }: { role: Role; nav: NavItem[] }) {
  const [session, setSession] = useState<Session | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("Pune");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const activeSession = readSession(role);
      setSession(activeSession);

      if (role === "inspector") {
        const profileRes = await getInspectorProfile();
        if (profileRes.success && profileRes.data) {
          setFullName(profileRes.data.fullName);
          setEmail(profileRes.data.email);
          setMobileNumber(profileRes.data.mobileNumber);
        }

        const inspectionsRes = await getMyInspections();
        if (inspectionsRes.success && inspectionsRes.data) {
          const mappedLogs = inspectionsRes.data
            .filter((ins) => ins.status !== "DRAFT" && ins.status !== "IN_PROGRESS")
            .map((ins) => {
              let text = "";
              const car = `${ins.brand || ""} ${ins.model || ""} ${ins.variant || ""}`.trim();
              const timeStr = ins.submittedAt
                ? new Date(ins.submittedAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recently";

              if (ins.status === "APPROVED") {
                text = `Vehicle ${ins.vehicleNumber} (${car}) approved by Admin`;
              } else if (ins.status === "REJECTED") {
                text = `Vehicle ${ins.vehicleNumber} (${car}) rejected. Reason: ${ins.rejectionReason || "images not clear"}`;
              } else if (ins.status === "SUBMITTED") {
                text = `Inspection report for ${ins.vehicleNumber} (${car}) uploaded and submitted`;
              }

              return { text, time: timeStr };
            });

          // Add a default welcome log at the end
          mappedLogs.push({ text: "Onboarded as verification inspector", time: "Welcome" });
          setActivityLogs(mappedLogs);
        }
      } else if (role === "dealer") {
        const profileRes = await getDealerProfile();
        if (profileRes.success && profileRes.data) {
          setFullName(profileRes.data.ownerName);
          setEmail(profileRes.data.email);
          setMobileNumber(profileRes.data.mobileNumber);
          setCity("Dealership: " + profileRes.data.dealershipName);
          
          setActivityLogs([
            { text: `KYC approved for ${profileRes.data.dealershipName}`, time: "Verified" },
            { text: "Onboarded as bidding dealer", time: "Welcome" },
          ]);
        }
      } else {
        // Fallback mock data for admin or other roles
        setFullName(activeSession?.name || "Admin User");
        setEmail(activeSession?.email || "admin@caryanam.com");
        setMobileNumber("+91 99999 99999");
        setActivityLogs([
          { text: "Onboarded as Admin Manager", time: "Active" }
        ]);
      }
    } catch (err) {
      console.error("Failed to load profile info", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [role]);

  const handleSaveChanges = async () => {
    try {
      if (role === "inspector") {
        // Update profile information
        const updateRes = await updateInspectorProfile({ fullName, mobileNumber });
        if (updateRes.success) {
          toast.success("Profile updated successfully.");
          
          // Update the session storage to reflect the name change instantly
          const storedSession = readSession(role);
          if (storedSession) {
            storedSession.name = fullName;
            localStorage.setItem(`${role}_session`, JSON.stringify(storedSession));
            // Trigger storage event so that header updates initials instantly
            window.dispatchEvent(new Event("storage"));
          }
        }

        // Change password if parameters are filled
        if (currentPassword && newPassword) {
          const passRes = await changeInspectorPassword({ currentPassword, newPassword });
          if (passRes.success) {
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
          }
        } else if (currentPassword || newPassword) {
          toast.error("Both current and new passwords are required to change password.");
        }
      } else if (role === "dealer") {
        // Update dealer profile information
        const updateRes = await updateDealerProfile({ fullName, mobileNumber });
        if (updateRes.success) {
          toast.success("Profile updated successfully.");
          
          // Update the session storage to reflect the name change instantly
          const storedSession = readSession(role);
          if (storedSession) {
            storedSession.name = fullName;
            localStorage.setItem(`${role}_session`, JSON.stringify(storedSession));
            window.dispatchEvent(new Event("storage"));
          }
        }

        // Change dealer password
        if (currentPassword && newPassword) {
          const passRes = await changeDealerPasswordApi({ currentPassword, newPassword });
          if (passRes.success) {
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
          }
        } else if (currentPassword || newPassword) {
          toast.error("Both current and new passwords are required to change password.");
        }
      } else {
        toast.success("Profile saved (mock).");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile settings.");
    }
  };

  const initials = fullName.slice(0, 2).toUpperCase() || (session?.name ?? role).slice(0, 2).toUpperCase();

  return (
    <AppShell
      role={role}
      nav={nav}
      title="Profile"
      breadcrumb={[role.charAt(0).toUpperCase() + role.slice(1), "Profile"]}
    >
      {loading ? (
        <div className="flex h-60 items-center justify-center bg-card border border-border rounded-3xl shadow-soft">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-5 xl:grid-cols-3">
            <Panel className="glass-card text-center flex flex-col items-center justify-center p-6">
              <span className="mx-auto grid size-24 place-items-center rounded-3xl bg-foreground text-2xl font-extrabold text-background shadow-md">
                {initials}
              </span>
              <p className="mt-5 text-lg font-extrabold text-foreground">{fullName}</p>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">{email}</p>
              <p className="mt-2 text-[10px] font-extrabold tracking-widest text-[#FFC700] uppercase bg-[#FFC700]/10 border border-[#FFC700]/30 rounded-lg px-2.5 py-1">
                {role}
              </p>
            </Panel>

            <Panel title="Personal information" className="xl:col-span-2">
              <div className="grid gap-4.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">Full name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none focus:border-[#FFC700] shadow-soft"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">Email</span>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-2xl border border-border bg-secondary/60 px-4 py-3.5 text-sm font-extrabold text-muted-foreground outline-none shadow-soft"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">Mobile number</span>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    maxLength={10}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none focus:border-[#FFC700] shadow-soft"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">City</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none focus:border-[#FFC700] shadow-soft"
                  />
                </label>
              </div>

              <h3 className="mt-8 mb-4 text-sm font-extrabold text-foreground">Change password</h3>
              <div className="grid gap-4.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">Current password</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none focus:border-[#FFC700] shadow-soft"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-muted-foreground">New password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-extrabold text-foreground outline-none focus:border-[#FFC700] shadow-soft"
                  />
                </label>
              </div>

              <button
                onClick={handleSaveChanges}
                className="mt-6 rounded-2xl bg-[#FFC700] hover:bg-[#FFD633] px-6 py-3.5 text-xs font-extrabold text-[#0D0E12] shadow-[0_4px_16px_rgba(255,199,0,0.35)] transition-all cursor-pointer"
              >
                Save changes
              </button>
            </Panel>
          </div>

          <Panel title="Activity log">
            {activityLogs.length === 0 ? (
              <p className="text-xs font-semibold text-muted-foreground text-center py-6">
                No recent activity records.
              </p>
            ) : (
              <ol className="space-y-5">
                {activityLogs.map((a, idx) => (
                  <li key={idx} className="relative pl-6">
                    <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-[#FFC700] ring-4 ring-[#FFC700]/20" />
                    <p className="text-sm font-extrabold text-foreground">{a.text}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{a.time}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}