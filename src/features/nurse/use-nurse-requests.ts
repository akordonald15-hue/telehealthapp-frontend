"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import { homeCareApi } from "@/lib/api/endpoints";
import type { HomeCareAssignment, HomeCareRequestDetail } from "@/lib/types/backend";

export type NurseRequestWithAssignment = HomeCareRequestDetail & {
  current_assignment: HomeCareAssignment | null;
};

function mergeAssignmentsWithRequests(
  assignments: HomeCareAssignment[],
  details: Array<HomeCareRequestDetail | undefined>,
): NurseRequestWithAssignment[] {
  const assignmentsByRequest = new Map<number, HomeCareAssignment>();

  for (const assignment of assignments) {
    const current = assignmentsByRequest.get(assignment.request);
    if (!current || assignment.is_current || new Date(assignment.updated_at).getTime() > new Date(current.updated_at).getTime()) {
      assignmentsByRequest.set(assignment.request, assignment);
    }
  }

  return details
    .map((detail) => {
      if (!detail) {
        return null;
      }

      return {
        ...detail,
        current_assignment: assignmentsByRequest.get(detail.id) ?? detail.current_assignment ?? null,
      };
    })
    .filter((detail): detail is NurseRequestWithAssignment => detail !== null);
}

export function useNurseRequests(enabled: boolean, pageSize = 50) {
  const assignmentsQuery = useQuery({
    queryKey: ["home-care", "assignments", "nurse", pageSize],
    queryFn: () => homeCareApi.assignments({ page_size: pageSize }),
    enabled,
  });

  const assignments = assignmentsQuery.data?.results ?? [];
  const requestIds = [...new Set(assignments.map((assignment) => assignment.request))];

  const detailQueries = useQueries({
    queries: requestIds.map((requestId) => ({
      queryKey: ["home-care", "request", requestId],
      queryFn: () => homeCareApi.requestDetail(requestId),
      enabled,
    })),
  });

  const requests = mergeAssignmentsWithRequests(assignments, detailQueries.map((query) => query.data));

  return {
    requests,
    isLoading: assignmentsQuery.isLoading || detailQueries.some((query) => query.isLoading),
    isError: assignmentsQuery.isError || detailQueries.some((query) => query.isError),
    error: assignmentsQuery.error ?? detailQueries.find((query) => query.error)?.error ?? null,
  };
}
