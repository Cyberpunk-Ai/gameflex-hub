export const QUERY_KEYS = {
  tournaments: {
    all: ["tournaments"] as const,
    detail: (id: string) => ["tournaments", id] as const,
    registrations: (id: string) => ["tournaments", id, "registrations"] as const,
    matches: (id: string) => ["tournaments", id, "matches"] as const,
    leaderboard: (id: string) => ["tournaments", id, "leaderboard"] as const,
  },
  leaderboard: {
    global: ["leaderboard", "global"] as const,
    byGame: (game: string) => ["leaderboard", "game", game] as const,
    userRank: (userId: string) => ["leaderboard", "user", userId] as const,
  },
  profiles: {
    detail: (userId: string) => ["profiles", userId] as const,
    followers: (userId: string) => ["profiles", userId, "followers"] as const,
    following: (userId: string) => ["profiles", userId, "following"] as const,
  },
  notifications: {
    list: (userId: string) => ["notifications", userId] as const,
    unreadCount: (userId: string) => ["notifications", userId, "unreadCount"] as const,
  },
  messages: {
    conversations: (userId: string) => ["conversations", userId] as const,
    messages: (conversationId: string) => ["messages", conversationId] as const,
  },
  marketplace: {
    listings: ["marketplace"] as const,
    detail: (id: string) => ["marketplace", id] as const,
  },
  social: {
    feed: (userId: string) => ["social", "feed", userId] as const,
    statuses: (userId: string) => ["social", "statuses", userId] as const,
  },
  achievements: {
    list: ["achievements"] as const,
    userAchievements: (userId: string) => ["achievements", "user", userId] as const,
  },
  wallet: {
    payments: (userId: string) => ["wallet", "payments", userId] as const,
    rewards: (userId: string) => ["wallet", "rewards", userId] as const,
  },
  search: {
    results: (query: string, entities?: string[]) => ["search", query, entities] as const,
  },
  friends: {
    list: (userId: string) => ["friends", userId] as const,
  },
};
