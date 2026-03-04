import api from "./index";

export const googleLogin = async (idToken) => {
    return await api.post("/auth/google", { idToken });
}

export const registerLocal = async (payload) => {
    return await api.post("/auth/register", payload);
}

export const loginLocal = async (payload) => {
    return await api.post("/auth/login", payload);
}

export const verifyEmail = async (payload) => {
    return await api.post("/auth/verify-email", payload);
}

export const resendVerification = async (payload) => {
    return await api.post("/auth/resend-verification", payload);
}

export const forgotPassword = async (payload) => {
    return await api.post("/auth/forgot-password", payload);
}

export const resetPassword = async (payload) => {
    return await api.post("/auth/reset-password", payload);
}

export const refreshToken = async () => {
    return await api.get("/auth/refresh-token");
}

export const logOut = async () => {
    return await api.get("/auth/logout");
}
