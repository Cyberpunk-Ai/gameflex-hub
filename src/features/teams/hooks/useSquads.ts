import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { squadService, type SquadRole } from "@/services/squads/SquadService";

export function useMySquads(userId?: string) {
  return useQuery({
    queryKey: ["squads", "mine", userId],
    enabled: !!userId,
    queryFn: () => squadService.getMySquads(userId!),
  });
}

export function useDiscoverSquads(userId?: string) {
  return useQuery({
    queryKey: ["squads", "discover", userId],
    enabled: !!userId,
    queryFn: () => squadService.discoverSquads(userId!),
  });
}

export function useSquadMembers(squadId?: string) {
  return useQuery({
    queryKey: ["squads", "members", squadId],
    enabled: !!squadId,
    queryFn: () => squadService.getMembers(squadId!),
  });
}

export function useMyInvites(userId?: string) {
  return useQuery({
    queryKey: ["squads", "invites", userId],
    enabled: !!userId,
    queryFn: () => squadService.getMyInvites(userId!),
  });
}

export function useSquadInvites(squadId?: string) {
  return useQuery({
    queryKey: ["squads", "squad-invites", squadId],
    enabled: !!squadId,
    queryFn: () => squadService.getSquadInvites(squadId!),
  });
}

export function useInviteCandidates(userId?: string, squadId?: string) {
  return useQuery({
    queryKey: ["squads", "invite-candidates", userId, squadId],
    enabled: !!userId && !!squadId,
    queryFn: () => squadService.getInviteCandidates(userId!, squadId!),
  });
}

/** Squad chat with a realtime subscription that refetches on new messages. */
export function useSquadChat(squadId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["squads", "messages", squadId],
    enabled: !!squadId,
    queryFn: () => squadService.getMessages(squadId!),
  });

  useEffect(() => {
    if (!squadId) return;
    return squadService.subscribeToMessages(squadId, () => {
      queryClient.invalidateQueries({ queryKey: ["squads", "messages", squadId] });
    });
  }, [squadId, queryClient]);

  return query;
}

export function useSendSquadMessage(squadId?: string, userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { error } = await squadService.sendMessage(squadId!, userId!, content);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads", "messages", squadId] });
    },
  });
}

export function useSquadRoleMutation(squadId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: SquadRole }) => {
      const { error } = await squadService.setRole(memberId, role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads", "members", squadId] });
    },
  });
}
