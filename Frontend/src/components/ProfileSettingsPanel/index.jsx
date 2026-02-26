import { Bell, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function ProfileSettingsPanel({ displayName, email }) {
  return (
    <div className="space-y-6 lg:col-span-8">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Used in activity logs and collaboration.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold">Full Name</span>
            <Input defaultValue={displayName} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Email</span>
            <Input defaultValue={email} disabled />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Phone</span>
            <Input placeholder="+84 ..." />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold">Timezone</span>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option>Asia/Ho_Chi_Minh</option>
              <option>Asia/Bangkok</option>
              <option>UTC</option>
            </select>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              Screening completed
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              New top candidate
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              Job about to close
              <input type="checkbox" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Screening Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Shortlist Above Score</span>
              <Input defaultValue="85" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Auto-reject Below Score</span>
              <Input defaultValue="60" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Default Candidate Sort</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option>Highest match score</option>
                <option>Most recent applicant</option>
                <option>Most experience</option>
              </select>
            </label>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save Profile Settings</Button>
      </div>
    </div>
  );
}

export default ProfileSettingsPanel;
