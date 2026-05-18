"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/endpoints";
import { clearTokens, hasStoredSession, setTokens } from "@/lib/auth/tokens";
import type { User } from "@/lib/types/backend";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: hasStoredSession(),
  });
}

async function handleAuthSuccess(
  tokens: { access: string; refresh?: string },
  queryClient: ReturnType<typeof useQueryClient>,
  router: ReturnType<typeof useRouter>,
) {
  setTokens(tokens);
  const user = await queryClient.fetchQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
  });
  await queryClient.invalidateQueries({ queryKey: authKeys.me });
  if (user.must_change_password) {
    router.replace("/change-password");
    return;
  }
  router.replace(user.role === "patient" ? "/triage" : "/dashboard");
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
      const user = await queryClient.fetchQuery({
        queryKey: authKeys.me,
        queryFn: authApi.me,
      });
      router.replace(user.role === "patient" ? "/triage" : "/dashboard");
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
