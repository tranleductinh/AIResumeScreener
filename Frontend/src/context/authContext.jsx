import { auth, googleProvider } from "@/firebase";
import { googleLogin, loginLocal, logOut, refreshToken } from "@/services/api/auth";
import { signInWithPopup } from "firebase/auth";
import { createContext, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

const withAccessToken = (storedUser, accessToken) => {
  const nextUser = { ...(storedUser || {}) };

  nextUser.accessToken = accessToken;

  if (nextUser?.data && typeof nextUser.data === "object") {
    nextUser.data = {
      ...nextUser.data,
      accessToken,
    };
  }

  if (nextUser?.data?.data && typeof nextUser.data.data === "object") {
    nextUser.data.data = {
      ...nextUser.data.data,
      accessToken,
    };
  }

  return nextUser;
};

export const AuthContextPrivider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );
  const navigate = useNavigate();

  const setUserAndPersist = (nextUser) => {
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("user");
    }
    setUser(nextUser);
  };

  const loginGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await googleLogin(idToken);
      setUserAndPersist(response.data.data);
      toast.success("User logged in successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Login failed. Please try again.",
      );
    }
  };

  const loginWithEmail = async ({ email, password }) => {
    const response = await loginLocal({ email, password });
    setUserAndPersist(response.data.data);
    return response.data.data;
  };

  const syncSession = async () => {
    const parseUserInfo = JSON.parse(localStorage.getItem("user")) || null;
    if (!parseUserInfo) {
      setUserAndPersist(null);
      return null;
    }

    try {
      const response = await refreshToken();
      const nextAccessToken = response?.data?.data?.accessToken;
      if (!nextAccessToken) {
        throw new Error("Missing access token");
      }

      const nextUser = withAccessToken(parseUserInfo, nextAccessToken);

      setUserAndPersist(nextUser);
      return nextUser;
    } catch (error) {
      setUserAndPersist(null);
      throw error;
    }
  };

  const logOutContext = async () => {
    try {
      await logOut();
      setUserAndPersist(null);
      toast.success("User logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Logout failed. Please try again.",
      );
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loginGoogle,
        loginWithEmail,
        logOutContext,
        syncSession,
        setUserAndPersist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
