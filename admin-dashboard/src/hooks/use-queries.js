import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOverview,
  fetchByType,
  fetchByDay,
  fetchLogs,
  fetchSosAlerts,
  resolveSos,
  acknowledgeSos,
  fetchFeedback,
  fetchFeedbackStats,
  reviewFeedback,
  exportFeedbackDataset,
  fetchBroadcasts,
  sendBroadcast,
  fetchHeatmap,
  fetchUsers,
  toggleUserRole,
  createUser,
  updateUser,
  deleteUser,
  lockUser,
  unlockUser,
} from "@/services/api";

// ─── Query Keys ─────────────────────────────
// Centralized keys prevent typo-bugs and enable targeted invalidation

export const queryKeys = {
  overview: ["stats", "overview"],
  byType: ["stats", "byType"],
  byDay: (days) => ["stats", "byDay", days],
  logs: (page, limit) => ["stats", "logs", page, limit],
  sosAlerts: (page, limit) => ["sos", "alerts", page, limit],
  feedback: (page, limit, onlyWrong) => ["feedback", "list", page, limit, onlyWrong],
  feedbackStats: ["feedback", "stats"],
  broadcasts: (page, limit) => ["broadcast", "list", page, limit],
  heatmap: (type, days) => ["heatmap", type, days],
  users: (page, limit, search) => ["users", "list", page, limit, search],
};

// ─── Stats / Dashboard ──────────────────────

export function useOverview() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: fetchOverview,
  });
}

export function useByType() {
  return useQuery({
    queryKey: queryKeys.byType,
    queryFn: fetchByType,
  });
}

export function useByDay(days = 30) {
  return useQuery({
    queryKey: queryKeys.byDay(days),
    queryFn: () => fetchByDay(days),
  });
}

export function useLogs(page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.logs(page, limit),
    queryFn: () => fetchLogs(page, limit),
    placeholderData: (prev) => prev, // giữ data cũ khi đổi page
  });
}

// ─── SOS ────────────────────────────────────

export function useSosAlerts(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.sosAlerts(page, limit),
    queryFn: () => fetchSosAlerts(page, limit),
    placeholderData: (prev) => prev,
  });
}

export function useResolveSos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => resolveSos(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sos"] }),
  });
}

export function useAcknowledgeSos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => acknowledgeSos(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sos"] }),
  });
}

// ─── Feedback ───────────────────────────────

export function useFeedback(page = 1, limit = 20, onlyWrong = false) {
  return useQuery({
    queryKey: queryKeys.feedback(page, limit, onlyWrong),
    queryFn: () => fetchFeedback(page, limit, onlyWrong),
    placeholderData: (prev) => prev,
  });
}

export function useFeedbackStats() {
  return useQuery({
    queryKey: queryKeys.feedbackStats,
    queryFn: fetchFeedbackStats,
  });
}

export function useReviewFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, correctLabel }) => reviewFeedback(id, correctLabel),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
}

export function useExportDataset() {
  return useMutation({
    mutationFn: exportFeedbackDataset,
  });
}

// ─── Broadcast ──────────────────────────────

export function useBroadcasts(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.broadcasts(page, limit),
    queryFn: () => fetchBroadcasts(page, limit),
    placeholderData: (prev) => prev,
  });
}

export function useSendBroadcast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ message, targetType, targetIds, priority }) =>
      sendBroadcast(message, targetType, targetIds, priority),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broadcast"] }),
  });
}

// ─── Heatmap ────────────────────────────────

export function useHeatmap(type = "danger", days = 30) {
  return useQuery({
    queryKey: queryKeys.heatmap(type, days),
    queryFn: () => fetchHeatmap(type, days),
    staleTime: 60_000, // heatmap ít thay đổi
  });
}

// ─── Users ──────────────────────────────────

export function useUsers(page = 1, limit = 20, search = "") {
  return useQuery({
    queryKey: queryKeys.users(page, limit, search),
    queryFn: () => fetchUsers(page, limit, search),
    placeholderData: (prev) => prev,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, role }) => createUser(email, password, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useToggleUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => toggleUserRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useLockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => lockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUnlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => unlockUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
