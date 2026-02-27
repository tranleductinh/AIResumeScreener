import { useContext } from "react";

import AccountCard from "@/components/AccountCard";
import ProfileSettingsPanel from "@/components/ProfileSettingsPanel";
import AuthContext from "@/context/authContext";

const ProfilePage = () => {
  const { user, logOutContext } = useContext(AuthContext);
  const userInfo = user?.user || user || {};
  const displayName = userInfo?.fullName || userInfo?.name || "Recruiter";
  const email = userInfo?.email || "";
  const avatar = userInfo?.avatar || userInfo?.avatarUrl || "";
  const role = userInfo?.role || "recruiter";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Recruiter Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal info and default hiring preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <AccountCard
          displayName={displayName}
          email={email}
          avatar={avatar}
          role={role}
          onLogout={logOutContext}
        />

        <ProfileSettingsPanel displayName={displayName} email={email} />
      </div>
    </div>
  );
}

export default ProfilePage;
