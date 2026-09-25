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
      if (typeof window !== "undefined") {
        localStorage.removeItem("patient_profile");
      }
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
          // Check for existing patient profile in dev / demo
          if (typeof window !== "undefined") {
            const savedPatient = localStorage.getItem("patient_profile");
            const hasAuthSession = document.cookie.includes("auth_session=1");
            const isPatientRole = document.cookie.includes("auth_role=patient");
            if (savedPatient && hasAuthSession && isPatientRole) {
              const parsed = JSON.parse(savedPatient) as User;
              setUser(parsed);
              setSessionCookies(parsed);
              return;
            }
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
    try {
      const response = await apiClient.post<{ accessToken: string; expiresIn: number; user: User }, { phoneNumber: string; otp: string }>(
        "/api/v1/auth/patient/verify-otp",
        { phoneNumber, otp }
      );
      setAccessToken(response.accessToken);
      setUser(response.user);
      setSessionCookies(response.user);
      scheduleSilentRefresh(response.expiresIn);
      if (typeof window !== "undefined") {
        localStorage.setItem("patient_profile", JSON.stringify(response.user));
      }
      return response.user;
    } catch {
      // Support development / demo Mock OTP verification
      if (otp === "123456" || (otp.length === 6 && /^\d+$/.test(otp))) {
        const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
        const mockPatientUser: User = {
          id: "patient-" + cleanPhone,
          email: `${cleanPhone}@patient.dentalcare.vn`,
          fullName: "Bệnh nhân " + (cleanPhone.length >= 4 ? cleanPhone.slice(-4) : cleanPhone),
          phoneNumber: cleanPhone,
          patientCode: `BN-2026-${cleanPhone.slice(-4) || "8888"}`,
          activeClinicId: null,
          roles: ["Patient"],
          permissions: ["patient.read_records", "patient.book_appointment"],
          assignedClinicIds: []
        };

        const mockAccessToken = "mock-patient-jwt-token-" + Date.now();
        setAccessToken(mockAccessToken);
        setUser(mockPatientUser);
        setSessionCookies(mockPatientUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("patient_profile", JSON.stringify(mockPatientUser));
        }
        return mockPatientUser;
      }
      throw new Error("Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại với mã 123456.");
    }
  }, [scheduleSilentRefresh]);

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
        logout,
        switchClinic,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
