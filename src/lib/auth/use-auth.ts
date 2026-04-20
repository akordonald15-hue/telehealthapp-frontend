"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authApi } from "@/lib/api/endpoints";
import { clearTokens, getRefreshToken, hasStoredSession, setTokens } from "@/lib/auth/tokens";
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

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (tokens) => {
      setTokens(tokens);
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      router.replace("/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const refresh = getRefreshToken();
      if (refresh) {
        await authApi.logout({ refresh });
      }
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
