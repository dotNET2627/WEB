"use client";

import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, executeRefreshToken, setAccessToken, setOnSessionExpired } from "@/lib/api-client";
import type { LoginRequest, LoginResponse, SwitchClinicResponse, User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  loginWithPhoneOtp: (phoneNumber: string, otp: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: (redirectPath?: string) => Promise<void>;
  switchClinic: (targetClinicId: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function setSessionCookies(user: User) {
  if (typeof document === "undefined") return;
  let roleValue = "staff";
  if (user.roles?.some((r) => r.toLowerCase() === "superadmin")) {
    roleValue = "superadmin";
  } else if (user.roles?.some((r) => r.toLowerCase() === "patient")) {
    roleValue = "patient";
  } else if (user.roles?.some((r) => r.toLowerCase() === "doctor")) {
    roleValue = "doctor";
  } else if (user.roles?.some((r) => r.toLowerCase() === "receptionist")) {
    roleValue = "receptionist";
  }
  document.cookie = `auth_session=1; path=/; SameSite=Lax`;
  document.cookie = `auth_role=${roleValue}; path=/; SameSite=Lax`;
}

function clearSessionCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie = "auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Proactive Silent Refresh: Schedule background refresh 1 minute before expiry
  const scheduleSilentRefresh = useCallback((expiresInSeconds: number) => {
    clearRefreshTimer();
    const refreshDelayMs = Math.max(10, (expiresInSeconds - 60)) * 1000;

    refreshTimerRef.current = setTimeout(async () => {
      const newToken = await executeRefreshToken();
      if (newToken) {
        // Continue scheduling next cycle (15m token -> refresh every 14m)
        scheduleSilentRefresh(15 * 60);
      }
    }, refreshDelayMs);
  }, [clearRefreshTimer]);

  const logout = useCallback(async (redirectPath?: string) => {
    clearRefreshTimer();
    try {
      await apiClient.post("/api/v1/auth/revoke-token");
    } catch {
      // Ignore network failures during logout
    } finally {
      setAccessToken(null);
      setUser(null);
      clearSessionCookies();
      if (typeof window !== "undefined") {
        localStorage.removeItem("patient_profile");
      }
      const isCurrentAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      const isCurrentPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/portal");
      const defaultRedirect = isCurrentAdmin
        ? "/admin/login"
        : isCurrentPortal
        ? "/portal/login"
        : "/login";
      const target = redirectPath || defaultRedirect;
      if (typeof window !== "undefined") {
        window.location.href = target;
      } else {
        router.push(target);
      }
    }
  }, [clearRefreshTimer, router]);

  // Initial session restoration on mount
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      clearSessionCookies();
      const isCurrentAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
      const isCurrentPortal = typeof window !== "undefined" && window.location.pathname.startsWith("/portal");
      const target = isCurrentAdmin
        ? "/admin/login"
        : isCurrentPortal
        ? "/portal/login"
        : "/login";
      if (typeof window !== "undefined") {
        window.location.href = target;
      } else {
        router.push(target);
      }
    });

    async function initializeAuth() {
      try {
        const token = await executeRefreshToken();
        if (token) {
          const profile = await apiClient.get<User>("/api/v1/auth/me");
          setUser(profile);
          setSessionCookies(profile);
          scheduleSilentRefresh(15 * 60);
        } else {
          // Kiểm tra session cookie của bệnh nhân
          const hasAuthSession = typeof document !== "undefined" && document.cookie.includes("auth_session=1");
          const isPatientRole = typeof document !== "undefined" && document.cookie.includes("auth_role=patient");
          if (hasAuthSession && isPatientRole) {
            const patientUser: User = {
              id: "patient-session",
              email: "patient@dentalcare.vn",
              fullName: "Bệnh nhân",
              activeClinicId: null,
              roles: ["Patient"],
              permissions: ["patient.read_records", "patient.book_appointment"],
              assignedClinicIds: []
            };
            setUser(patientUser);
            return;
          }
          clearSessionCookies();
        }
      } catch {
        setUser(null);
        clearSessionCookies();
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();

    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, router, scheduleSilentRefresh]);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    const response = await apiClient.post<LoginResponse, LoginRequest>(
      "/api/v1/auth/login",
      credentials
    );

    setAccessToken(response.accessToken);
    setUser(response.user);
    setSessionCookies(response.user);
    scheduleSilentRefresh(response.expiresIn);
    return response.user;
  }, [scheduleSilentRefresh]);

  const loginWithPhoneOtp = useCallback(async (phoneNumber: string, otp: string): Promise<User> => {
    const response = await fetch("/api/auth/patient/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, otp })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Mã OTP không chính xác hoặc đã hết hạn.");
    }

    const patientUser: User = data.user;
    setUser(patientUser);
    return patientUser;
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<User> => {
    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Không thể đăng nhập bằng Google. Vui lòng thử lại sau.");
    }

    const patientUser: User = data.user;
    setUser(patientUser);
    return patientUser;
  }, []);

  const switchClinic = useCallback(async (targetClinicId: string) => {
    const response = await apiClient.post<SwitchClinicResponse, { targetClinicId: string }>(
      "/api/v1/auth/switch-clinic",
      { targetClinicId }
    );

    setAccessToken(response.accessToken);
    scheduleSilentRefresh(response.expiresIn);

    // Refresh current user state with new clinic context
    const profile = await apiClient.get<User>("/api/v1/auth/me");
    setUser(profile);
    setSessionCookies(profile);
  }, [scheduleSilentRefresh]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      const normalized = permission.trim().toLowerCase();
      return user.permissions.some(p => p.toLowerCase() === normalized);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithPhoneOtp,
        loginWithGoogle,
        logout,
        switchClinic,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
