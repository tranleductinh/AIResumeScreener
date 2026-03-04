import { CheckCircle2, Mail, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resendVerification, verifyEmail } from "@/services/api/auth";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailQuery = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailQuery);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [triedVerify, setTriedVerify] = useState(false);

  const hasTokenAndEmail = useMemo(() => Boolean(token && emailQuery), [emailQuery, token]);

  useEffect(() => {
    const autoVerify = async () => {
      if (!hasTokenAndEmail) return;

      setVerifying(true);
      try {
        await verifyEmail({ email: emailQuery, token });
        setVerified(true);
        toast.success("Email verified successfully.");
      } catch (error) {
        toast.error(error?.response?.data?.message || "Verify email failed.");
      } finally {
        setVerifying(false);
        setTriedVerify(true);
      }
    };

    autoVerify();
  }, [emailQuery, hasTokenAndEmail, token]);

  const handleManualVerify = async () => {
    if (!email || !token) {
      toast.error("Email and token are required.");
      return;
    }

    setVerifying(true);
    try {
      await verifyEmail({ email, token });
      setVerified(true);
      toast.success("Email verified successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verify email failed.");
    } finally {
      setVerifying(false);
      setTriedVerify(true);
    }
  };

  const handleResendVerification = async (event) => {
    event.preventDefault();
    if (!email) {
      toast.error("Email is required.");
      return;
    }

    setResending(true);
    try {
      await resendVerification({ email });
      toast.success("If account is unverified, verification email has been sent.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Resend verification failed.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border/80">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Email</CardTitle>
          <CardDescription>Complete email verification to activate your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4" />
                Your email is verified.
              </div>
              <p>You can now sign in with your account.</p>
            </div>
          ) : triedVerify ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <ShieldAlert className="size-4" />
                Verification not completed
              </div>
              <p>Use the resend button below to request a new verification email.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {verifying ? "Verifying your email..." : "Waiting for verification action."}
            </p>
          )}

          {!verified && token ? (
            <Button type="button" onClick={handleManualVerify} disabled={verifying} className="w-full">
              {verifying ? "Verifying..." : "Verify with this link"}
            </Button>
          ) : null}

          <form className="space-y-3" onSubmit={handleResendVerification}>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Email Address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  className="h-11 pl-9"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
            </label>

            <Button type="submit" variant="outline" className="w-full" disabled={resending}>
              {resending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;

