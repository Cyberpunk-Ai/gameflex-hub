import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { messagesService } from "@/services/messages/MessagesService";

export function useConversations(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.messages.conversations(userId),
    queryFn: () => messagesService.getConversations(userId),
    enabled: !!userId,
    refetchInterval: 15 * 1000, // poll every 15s
  });
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: QUERY_KEYS.messages.messages(conversationId),
    queryFn: () => messagesService.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5 * 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ senderId, content }: { senderId: string; content: string }) =>
      messagesService.sendMessage(conversationId, senderId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages.messages(conversationId) });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    send: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participant1Id,
      participant2Id,
    }: {
      participant1Id: string;
      participant2Id: string;
    }) => messagesService.createConversation(participant1Id, participant2Id),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages.conversations(vars.participant1Id),
      });
    },
  });
}
