"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/endpoints";
import { clearTokens, hasStoredSession, setTokens } from "@/lib/auth/tokens";
import type { User } from "@/lib/types/backend";

export const authKeys = {
  me: ["auth", "me"] as const,
};

const STORED_AUTH_USER_KEY = "caretekk:auth-user";

function storeAuthUser(user: User) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(STORED_AUTH_USER_KEY, JSON.stringify(user));
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: hasStoredSession(),
  });
}

async function handleAuthSuccess(
  tokens: { access: string; refresh?: string; user?: User },
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>,
) {
  setTokens(tokens);
  if (tokens.user) {
    queryClient.setQueryData(authKeys.me, tokens.user);
    storeAuthUser(tokens.user);
  }
  const user =
    tokens.user ||
    (await queryClient.fetchQuery({
      queryKey: authKeys.me,
      queryFn: authApi.me,
    }));
  if (!user) {
    throw new Error("Authenticated user could not be loaded.");
  }
  await queryClient.invalidateQueries({ queryKey: authKeys.me });
  if (user.must_change_password) {
    router.replace("/change-password");
    return;
  }
  router.replace("/dashboard");
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (tokens) => handleAuthSuccess(tokens, queryClient, router),
  });
}

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.google,
    onSuccess: async (tokens) => handleAuthSuccess(tokens, queryClient, router),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      await queryClient.fetchQuery({
        queryKey: authKeys.me,
        queryFn: authApi.me,
      });
      router.replace("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
    },
    onSettled: async () => {
      clearTokens();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(STORED_AUTH_USER_KEY);
      }
      queryClient.setQueryData<User | null>(authKeys.me, null);
      await queryClient.invalidateQueries();
      router.replace("/login");
    },
  });
}

export function useRequireAuth() {
  const router = useRouter();
  const userQuery = useCurrentUser();

  if (typeof window !== "undefined" && !hasStoredSession()) {
    router.replace("/login");
  }

  return userQuery;
}
