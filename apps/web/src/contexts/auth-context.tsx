"use client";

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ApiClientError, createApiClient, type ApiError } from "@/lib/api-client";
import { clearToken, readToken, writeToken } from "@/utils/storage";
import type { AuthResponse, LoginDto, RegisterDto, SafeUser } from "@/types/auth";

interface AuthContextValue {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  register: (dto: RegisterDto) => Promise<void>;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as ApiError).message);
  }

  return "Something went wrong";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const apiClientRef = useRef(
    createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "", () => tokenRef.current),
  );
  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    clearToken();
  }, []);

  const clearSessionRef = useRef(clearSession);
  clearSessionRef.current = clearSession;

  const refreshUser = useCallback(async () => {
    setError(null);

    try {
      const currentUser = await apiClientRef.current.get<SafeUser>("/auth/me");
      if (!currentUser) {
        throw new ApiClientError(422, "User data missing from response");
      }
      setUser(currentUser);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError?.status === 401) {
        clearSessionRef.current();
        return;
      }

      setError(extractErrorMessage(err));
      throw err;
    }
  }, []);

  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  const handleAuthSuccess = useCallback(
    async (response?: AuthResponse) => {
      if (!response) {
        throw new ApiClientError(422, "Authentication response missing data");
      }
      const newToken = response.tokens.accessToken;
      setToken(newToken);
      tokenRef.current = newToken;
      writeToken(newToken);
      await refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClientRef.current.post<AuthResponse>("/auth/register", dto);
        await handleAuthSuccess(response);
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const login = useCallback(
    async (dto: LoginDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClientRef.current.post<AuthResponse>("/auth/login", dto);
        await handleAuthSuccess(response);
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const hydrate = async () => {
      const storedToken = readToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      tokenRef.current = storedToken;

      try {
        await refreshUserRef.current();
      } catch {
        // Error state already set by refreshUser.
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      error,
      register,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, error, register, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
