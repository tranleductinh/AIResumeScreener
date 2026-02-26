import { auth, googleProvider } from "@/firebase";
import { googleLogin, logOut } from "@/services/api/auth";
import { signInWithPopup } from "firebase/auth";
import { createContext, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
export const AuthContextPrivider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const navigate = useNavigate();
  const loginGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await googleLogin(idToken);
      setUser(response.data.data);
      localStorage.setItem("user", JSON.stringify(response.data.data));
      toast.success("User logged in successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Login failed. Please try again.",
      );
    }
  };
  const logOutContext = async () => {
    try {
      await logOut();
      localStorage.removeItem("user");
      setUser(null);
      toast.success("User logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Logout failed. Please try again.",
      );
    }
  };
  return (
    <AuthContext.Provider value={{ user, loginGoogle, logOutContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
