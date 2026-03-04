import { Bot, Lock, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerLocal } from "@/services/api/auth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Confirm password does not match");
      return;
    }

    setLoading(true);
    try {
      await registerLocal({ fullName, email, password });
      toast.success("Register successful. Please verify your email.");
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Register failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-primary p-14 lg:flex lg:flex-col lg:justify-center">
          <div className="absolute -left-20 top-0 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 max-w-xl space-y-8 text-primary-foreground">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-white text-primary">
                <Bot className="size-5" />
              </span>
              <p className="text-2xl font-bold">AI Resume Screener</p>
            </div>

            <h1 className="text-5xl font-black leading-tight tracking-tight">
              Build smarter hiring workflows from day one
            </h1>
            <p className="text-base leading-relaxed text-primary-foreground/90">
              Create your workspace and start screening resumes with AI-powered ranking, skill
              matching, and hiring insights.
            </p>
          </div>
        </aside>

        <main className="flex items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md border-border/80">
            <CardHeader>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Set up your AI Resume Screener workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Full Name</span>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-11 pl-9"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />
                  </div>
                </label>

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

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        className="h-11 pl-9"
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Confirm Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="password"
                        className="h-11 pl-9"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                      />
                    </div>
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input className="size-4 rounded border-input" type="checkbox" required />
                  <span>
                    I agree to the <span className="font-semibold text-foreground">Terms</span> and{" "}
                    <span className="font-semibold text-foreground">Privacy Policy</span>
                  </span>
                </label>

                <Button type="submit" className="mt-1 h-11 w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;

