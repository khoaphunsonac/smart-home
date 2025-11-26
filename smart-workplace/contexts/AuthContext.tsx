"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@/lib/api";

interface User {
    id: string;
    username: string;
    email: string;
    name: string;
    birthday?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: { username: string; password: string }) => Promise<void>;
    register: (userData: {
        username: string;
        email: string;
        password: string;
        name: string;
        birthday?: string;
        adaUsername: string;
        adakey: string;
    }) => Promise<void>;
    logout: () => void;
    updateProfile: (userData: { name?: string; birthday?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Khởi tạo auth state từ localStorage
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Kiểm tra nếu đang ở client-side
                if (typeof window !== "undefined") {
                    const savedToken = localStorage.getItem("token");
                    const savedUser = localStorage.getItem("user");

                    if (savedToken && savedUser) {
                        setToken(savedToken);
                        setUser(JSON.parse(savedUser));

                        // Verify token với server
                        try {
                            const profileData = await authAPI.getProfile();
                            setUser(profileData.data);
                        } catch (error) {
                            // Token không hợp lệ, xóa khỏi localStorage
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            setToken(null);
                            setUser(null);
                        }
                    }
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials: { username: string; password: string }) => {
        console.log("AuthContext: Starting login process...");
        try {
            const raw = await authAPI.login(credentials);
            // api.login returns response.data which is { success: true, data: { user, token } }
            console.log("AuthContext: Raw login response:", raw);

            // Backend returns: { success: true, data: { user, token } }
            // So raw.data contains { user, token }
            const payload = raw?.data ?? raw; // normalize
            console.log("AuthContext: Normalized payload:", payload);

            // Extract token and user from payload
            // payload should be { user, token } after normalization
            const newToken =
                payload?.data?.token ?? payload?.token ?? payload?.data?.accessToken ?? payload?.accessToken;
            const userData = payload?.data?.user ?? payload?.user;

            console.log("AuthContext: Extracted token:", newToken ? "Present" : "Missing");
            console.log("AuthContext: Extracted user:", userData ? userData.username : "Missing");

            if (!newToken || !userData) {
                console.error("AuthContext: Invalid response structure", payload);
                console.error("AuthContext: Full raw response:", raw);
                throw new Error("Invalid response from server");
            }

            // Save to state
            console.log("AuthContext: Setting token and user in state...");
            setToken(newToken);
            setUser(userData);

            // Save to localStorage (only on client)
            if (typeof window !== "undefined") {
                localStorage.setItem("token", newToken);
                localStorage.setItem("user", JSON.stringify(userData));
                console.log("AuthContext: Saved to localStorage");
            }

            console.log("AuthContext: Login completed successfully");
        } catch (error: any) {
            console.error("AuthContext: Login error:", error);
            console.error("AuthContext: Error response:", error?.response?.data ?? error?.message ?? error);

            // Extract error message from different possible error formats
            let errorMessage = "Đăng nhập thất bại";
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    };

    const register = async (userData: {
        username: string;
        email: string;
        password: string;
        name: string;
        birthday?: string;
        adaUsername: string;
        adakey: string;
    }) => {
        console.log("AuthContext: Starting register process...");
        try {
            const raw = await authAPI.register(userData);
            console.log("AuthContext: Raw register response:", raw);

            // Backend returns: { success: true, data: { user, token } }
            const payload = raw?.data ?? raw;

            const newToken =
                payload?.data?.token ?? payload?.token ?? payload?.data?.accessToken ?? payload?.accessToken;
            const newUser = payload?.data?.user ?? payload?.user;

            console.log("AuthContext: Extracted token:", newToken ? "Present" : "Missing");
            console.log("AuthContext: Extracted user:", newUser ? newUser.username : "Missing");

            if (!newToken || !newUser) {
                console.error("AuthContext: Invalid response structure", payload);
                throw new Error("Invalid response from server");
            }

            // Optionally set auth state after register
            setToken(newToken);
            setUser(newUser);
            if (typeof window !== "undefined") {
                localStorage.setItem("token", newToken);
                localStorage.setItem("user", JSON.stringify(newUser));
            }

            console.log("AuthContext: Register completed successfully");
        } catch (error: any) {
            console.error("AuthContext: Register error:", error);
            console.error("AuthContext: Error details:", {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                isNetworkError: error.isNetworkError,
            });

            // Extract error message from different possible error formats
            let errorMessage = "Đăng ký thất bại";

            // Network errors
            if (
                error.isNetworkError ||
                error.code === "ECONNREFUSED" ||
                error.code === "ERR_NETWORK" ||
                error.message === "Network Error"
            ) {
                errorMessage =
                    "Không thể kết nối đến server. Vui lòng kiểm tra:\n- Backend có đang chạy không (port 5000)\n- API URL có đúng không\n- CORS đã được cấu hình chưa";
            } else if (error?.response?.data?.errors) {
                // Validation errors
                errorMessage = error.response.data.errors.map((err: any) => err.msg).join(", ");
            } else if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    };

    const logout = () => {
        // Xóa khỏi state
        setToken(null);
        setUser(null);

        // Xóa khỏi localStorage (chỉ ở client-side)
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
    };

    const updateProfile = async (userData: { name?: string; birthday?: string }) => {
        try {
            const response = await authAPI.updateProfile(userData);
            const updatedUser = response.data;

            // Cập nhật state
            setUser(updatedUser);

            // Cập nhật localStorage (chỉ ở client-side)
            if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || "Cập nhật thông tin thất bại");
        }
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
