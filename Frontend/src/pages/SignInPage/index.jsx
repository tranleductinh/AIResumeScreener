import { Bot } from "lucide-react";

import { useContext, useState } from "react";
import AuthContext from "@/context/authContext";
import LoginCard from "@/components/LoginCard";


const SignInPage = () => {
  const { loginGoogle } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginGoogle();
    } catch (error) {
      console.error(error);
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
              Screen hundreds of resumes in minutes with AI
            </h1>
            <p className="text-base leading-relaxed text-primary-foreground/90">
              Improve hiring speed with an intelligent screening workflow that
              ranks candidates by skills, experience, and role fit.
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <LoginCard handleGoogleLogin={handleGoogleLogin} loading={loading}  />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
