import { Bot } from "lucide-react";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import LoginCard from "@/components/LoginCard";
import AuthContext from "@/context/authContext";

const SignInPage = () => {
  const { loginGoogle, loginWithEmail } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail({ email, password });
      toast.success("User logged in successfully");
      navigate("/dashboard");
    } catch (error) {
      if (error?.response?.data?.errorCode === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      }
      toast.error(error?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginGoogle();
    } finally {
      setGoogleLoading(false);
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
              Improve hiring speed with an intelligent screening workflow that ranks candidates by
              skills, experience, and role fit.
            </p>
          </div>
        </aside>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <LoginCard
            email={email}
            password={password}
            loading={loading}
            googleLoading={googleLoading}
            onEmailChange={(event) => setEmail(event.target.value)}
            onPasswordChange={(event) => setPassword(event.target.value)}
            onSubmitEmailLogin={handleEmailLogin}
            onSubmitGoogleLogin={handleGoogleLogin}
          />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
