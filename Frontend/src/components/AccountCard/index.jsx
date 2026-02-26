import { UserCircle2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getInitials(nameOrEmail) {
  if (!nameOrEmail) return "HR";
  const initials = nameOrEmail
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "HR";
}

function AccountCard({ displayName, email, avatar, role, onLogout }) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle2 className="size-4" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-14">
            <AvatarImage src={avatar} alt={displayName} />
            <AvatarFallback>{getInitials(displayName || email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email || "No email"}</p>
          </div>
        </div>
        <Badge variant="outline">{String(role).toUpperCase()}</Badge>
        <div className="grid gap-3">
          <Button variant="outline">Change Avatar</Button>
          <Button variant="outline">Change Password</Button>
          <Button variant="destructive" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccountCard;
