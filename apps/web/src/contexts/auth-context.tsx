"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { ApiClientError, createApiClient, type ApiError } from "@/lib/api-client";
import { clearToken, writeToken } from "@/utils/storage";
import type { LoginDto, RegisterDto, SafeUser } from "@/types/auth";

/**
 * Auth state.
 *
 * The access token is short-lived (~15 min) and kept entirely in memory.
 * Page reloads recover it via the BFF refresh endpoint, which exchanges
 * the HttpOnly refresh cookie for a fresh access token. No part of this
 * flow touches `localStorage`, which means an XSS payload cannot exfiltrate
 * a persistent credential.
 */
interface AuthContextValue {
  user: SafeUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  register: (dto: RegisterDto) => Promise<void>;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface BffAuthResponse {
  user: SafeUser;
  accessToken: string;
  expiresIn: number;
}

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as ApiError).message);
  }
  return "Something went wrong";
};

/**
 * Same-origin client used for BFF auth calls. No bearer token is attached
 * — the refresh cookie travels automatically with same-origin requests.
 */
const createBffClient = () => createApiClient("", () => null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokenRef = useRef<string | null>(null);
  const apiClientRef = useRef(
    createApiClient(
      process.env.NEXT_PUBLIC_API_URL ?? "",
      () => tokenRef.current,
    ),
  );
  const bffClientRef = useRef(createBffClient());

  const applySession = useCallback((nextUser: SafeUser, accessToken: string) => {
    setUser(nextUser);
    setToken(accessToken);
    tokenRef.current = accessToken;
    writeToken(accessToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    tokenRef.current = null;
    clearToken();
  }, []);

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
        clearSession();
        return;
      }
      setError(extractErrorMessage(err));
      throw err;
    }
  }, [clearSession]);

  const handleAuthSuccess = useCallback(
    (response: BffAuthResponse | undefined) => {
      if (!response?.accessToken || !response.user) {
        throw new ApiClientError(422, "Authentication response missing data");
      }
      applySession(response.user, response.accessToken);
    },
    [applySession],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await bffClientRef.current.post<BffAuthResponse>(
          "/api/auth/register",
          dto,
        );
        handleAuthSuccess(response);
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
        const response = await bffClientRef.current.post<BffAuthResponse>(
          "/api/auth/login",
          dto,
        );
        handleAuthSuccess(response);
      } catch (err) {
        setError(extractErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(async () => {
    try {
      await bffClientRef.current.post("/api/auth/logout");
    } catch {
      // Logout is best-effort: if upstream is unreachable we still clear
      // the local session so the user is not stuck in a phantom state.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /**
   * On mount, try to resurrect the session via the HttpOnly refresh
   * cookie. A 401 just means "not logged in" and is the silent default.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await bffClientRef.current.post<BffAuthResponse>(
          "/api/auth/refresh",
        );
        if (cancelled) return;
        if (response?.accessToken && response.user) {
          applySession(response.user, response.accessToken);
        }
      } catch {
        // Either no cookie or refresh rejected — both mean "logged out".
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

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
