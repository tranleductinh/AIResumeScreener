import axios from "axios";
import toast from "react-hot-toast";
import { refreshToken } from "./auth";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (_error) {
    return null;
  }
};

const getAccessTokenFromUser = (storedUser) => {
  if (!storedUser) return null;
  return (
    storedUser?.accessToken ||
    storedUser?.data?.accessToken ||
    storedUser?.data?.data?.accessToken ||
    null
  );
};

const setAccessTokenToStoredUser = (storedUser, accessToken) => {
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

  localStorage.setItem("user", JSON.stringify(nextUser));
};

let refreshPromise = null;
let hasRedirectedOnAuthError = false;

const publicAuthEndpoints = [
  "/auth/login",
  "/auth/register",
  "/auth/google",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const isPublicAuthEndpoint = (url = "") => {
  return publicAuthEndpoints.some((endpoint) => String(url).includes(endpoint));
};

const redirectToLoginOnAuthError = (message) => {
  localStorage.removeItem("user");

  if (!hasRedirectedOnAuthError) {
    hasRedirectedOnAuthError = true;
    if (message) {
      toast.error(message);
    }
    window.location.href = "/";
  }
};

const performRefreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshToken()
      .then((res) => {
        const parseUserInfo = getStoredUser();
        const token = res?.data?.data?.accessToken;

        if (!token) {
          throw new Error("Missing refreshed access token");
        }

        setAccessTokenToStoredUser(parseUserInfo, token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiInstance.interceptors.request.use(
  (config) => {
    const parseUserInfo = getStoredUser();
    const token = getAccessTokenFromUser(parseUserInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(error);
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh-token");
    const isPublicAuthRequest = isPublicAuthEndpoint(originalRequest?.url);

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isRefreshEndpoint &&
      !isPublicAuthRequest
    ) {
      originalRequest._retry = true;
      try {
        const token = await performRefreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiInstance(originalRequest);
      } catch (err) {
        console.error(err);
        redirectToLoginOnAuthError(err?.response?.data?.message || "Session expired. Please sign in again.");
      }
    }
    return Promise.reject(error);
  },
);

export default apiInstance;
