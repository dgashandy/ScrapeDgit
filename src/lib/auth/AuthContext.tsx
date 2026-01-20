"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    isVerified: boolean;
    avatarUrl: string | null;
    location: string | null;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const loadAuth = () => {
            try {
                const storedUser = localStorage.getItem("user");
                const storedToken = localStorage.getItem("accessToken");

                if (storedUser && storedToken) {
                    setUser(JSON.parse(storedUser));
                    setAccessToken(storedToken);
                }
            } catch (error) {
                console.error("Error loading auth:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuth();
    }, []);

    const login = (userData: User, tokens: { accessToken: string; refreshToken: string }) => {
        setUser(userData);
        setAccessToken(tokens.accessToken);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);

        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        router.push("/");
    };

    const refreshAuth = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) return;

            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (data.success) {
                setAccessToken(data.data.accessToken);
                localStorage.setItem("accessToken", data.data.accessToken);
                if (data.data.refreshToken) {
                    localStorage.setItem("refreshToken", data.data.refreshToken);
                }
            } else {
                logout();
            }
        } catch (error) {
            console.error("Error refreshing auth:", error);
            logout();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                isLoading,
                isAuthenticated: !!user && !!accessToken,
                login,
                logout,
                refreshAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
