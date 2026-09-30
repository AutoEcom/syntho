"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Identity } from "@dfinity/agent";
import type { AuthClient } from "@dfinity/auth-client";
import { ERROR_USER_INTERRUPT } from "@dfinity/auth-client";
import type { Principal } from "@dfinity/principal";
import { getAuthClient, II_LOGIN_OPTIONS } from "./auth-client";
import { formatPrincipalShort } from "./format";

export interface AuthValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  principal: Principal | null;
  principalText: string | null;
  identity: Identity | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function snapshotFrom(client: AuthClient): Pick<
  AuthValue,
  "isAuthenticated" | "principal" | "principalText" | "identity"
> {
  const identity = client.getIdentity();
  const principal = identity.getPrincipal();
  const isAuthenticated = !principal.isAnonymous();

  if (!isAuthenticated) {
    return {
      isAuthenticated: false,
      principal: null,
      principalText: null,
      identity: null,
    };
  }

  return {
    isAuthenticated: true,
    principal,
    principalText: formatPrincipalShort(principal),
    identity,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);

  const apply = useCallback((client: AuthClient) => {
    const next = snapshotFrom(client);
    setIsAuthenticated(next.isAuthenticated);
    setPrincipal(next.principal);
    setPrincipalText(next.principalText);
    setIdentity(next.identity);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const client = await getAuthClient();
        if (cancelled) return;
        apply(client);
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setPrincipal(null);
          setPrincipalText(null);
          setIdentity(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apply]);

  const login = useCallback(async () => {
    const client = await getAuthClient();
    setIsLoading(true);

    try {
      await new Promise<void>((resolve, reject) => {
        void client.login({
          ...II_LOGIN_OPTIONS,
          onSuccess: () => resolve(),
          onError: (error) => {
            if (error === ERROR_USER_INTERRUPT) {
              resolve();
              return;
            }
            reject(new Error(error ?? "Internet Identity login failed"));
          },
        });
      });
    } catch {
      // Stay signed out. Closing the II window is not an error.
    } finally {
      apply(client);
      setIsLoading(false);
    }
  }, [apply]);

  const logout = useCallback(async () => {
    const client = await getAuthClient();
    await client.logout();
    apply(client);
  }, [apply]);

  const value = useMemo<AuthValue>(
    () => ({
      isAuthenticated,
      isLoading,
      principal,
      principalText,
      identity,
      login,
      logout,
    }),
    [
      isAuthenticated,
      isLoading,
      principal,
      principalText,
      identity,
      login,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
