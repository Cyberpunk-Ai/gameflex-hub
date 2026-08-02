import {
  Tournament,
  Registration,
  Payment,
  Match,
  LeaderboardEntry,
  MarketplaceListing,
  SupportTicket,
  Notification,
  DashboardStats,
  GameRoom,
  Reward,
  User,
} from "@/types";

export const mockTournaments: Tournament[] = [
  {
    id: "t-1",
    title: "EA FC 24 Nairobi Championship",
    description:
      "The biggest 1v1 EA FC 24 tournament in East Africa. Battle through single elimination brackets for the grand KES 50,000 cash pool.",
    game: "fifa",
    format: "single_elimination",
    status: "live",
    entryFee: 500,
    prizePool: 50000,
    maxParticipants: 64,
    currentParticipants: 48,
    startDate: new Date(Date.now() - 3600000),
    registrationDeadline: new Date(Date.now() - 7200000),
    rules: "Standard 6-minute halves. Tactical defending mandatory. Best of 1 until Semi-Finals.",
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
    createdBy: "admin-1",
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: "t-2",
    title: "COD Mobile Warzone Blitz",
    description:
      "Squad Battle Royale showdown! Drop into Isolated, rack up kills, and secure top placement points.",
    game: "cod",
    format: "swiss",
    status: "registration_open",
    entryFee: 300,
    prizePool: 30000,
    maxParticipants: 32,
    currentParticipants: 22,
    startDate: new Date(Date.now() + 86400000 * 2),
    registrationDeadline: new Date(Date.now() + 86400000),
    rules: "Mobile devices only. No emulators allowed. Screenshots of match results required.",
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    createdBy: "admin-1",
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: "t-3",
    title: "PUBG Mobile Pro League Season 4",
    description: "4-man squad survival tournament. 4 maps played over 2 weekend sessions.",
    game: "pubg",
    format: "round_robin",
    status: "upcoming",
    entryFee: 1000,
    prizePool: 100000,
    maxParticipants: 16,
    currentParticipants: 12,
    startDate: new Date(Date.now() + 86400000 * 5),
    registrationDeadline: new Date(Date.now() + 86400000 * 4),
    rules: "Official ESPORTS settings. Point system: 1st=15pts, 2nd=12pts, Kill=1pt.",
    imageUrl:
      "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800",
    createdBy: "admin-1",
    createdAt: new Date(Date.now() - 86400000 * 2),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "t-4",
    title: "Valorant 5v5 Strike Cup",
    description: "Competitive 5v5 bomb defousal matches on Lotus & Ascent.",
    game: "valorant",
    format: "double_elimination",
    status: "registration_open",
    entryFee: 800,
    prizePool: 60000,
    maxParticipants: 16,
    currentParticipants: 10,
    startDate: new Date(Date.now() + 86400000 * 3),
    registrationDeadline: new Date(Date.now() + 86400000 * 2),
    rules: "MR12 standard rules. Vanguard anti-cheat strictly monitored.",
    imageUrl:
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&q=80&w=800",
    createdBy: "admin-1",
    createdAt: new Date(Date.now() - 86400000 * 4),
    updatedAt: new Date(Date.now() - 86400000 * 4),
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, user_id: "u-1", username: "ApexPredator", points: 4850, game_handle: "Apex_Viper" },
  { rank: 2, user_id: "u-2", username: "CyberNinja", points: 4320, game_handle: "Ninja_KE" },
  { rank: 3, user_id: "u-3", username: "FalconEye", points: 3980, game_handle: "Falcon_007" },
  { rank: 4, user_id: "u-4", username: "ShadowQueen", points: 3650, game_handle: "ShadowQ" },
  { rank: 5, user_id: "u-5", username: "GhostRider", points: 3410, game_handle: "Ghost_KE" },
  { rank: 6, user_id: "u-6", username: "TitanStriker", points: 3120, game_handle: "Titan_S" },
  { rank: 7, user_id: "u-7", username: "ViperX", points: 2950, game_handle: "Viper_X" },
  { rank: 8, user_id: "u-8", username: "BlazeGamer", points: 2800, game_handle: "Blaze_KE" },
];

export const mockGameRooms: GameRoom[] = [
  {
    id: "gr-1",
    name: "EA FC 24 High Stakes Room",
    game: "fifa",
    hostId: "u-1",
    hostName: "ApexPredator",
    entryFee: 200,
    maxPlayers: 2,
    currentPlayers: 1,
    status: "waiting",
    createdAt: new Date(),
  },
  {
    id: "gr-2",
    name: "COD Mobile 1v1 Sniper Battle",
    game: "cod",
    hostId: "u-2",
    hostName: "CyberNinja",
    entryFee: 150,
    maxPlayers: 2,
    currentPlayers: 2,
    status: "in_progress",
    createdAt: new Date(),
  },
  {
    id: "gr-3",
    name: "PUBG Squad Warmup Room",
    game: "pubg",
    hostId: "u-3",
    hostName: "FalconEye",
    entryFee: 100,
    maxPlayers: 4,
    currentPlayers: 3,
    status: "waiting",
    createdAt: new Date(),
  },
];

export const mockMarketplaceListings: MarketplaceListing[] = [
  {
    id: "m-1",
    sellerId: "u-1",
    sellerName: "ApexPredator",
    title: "FIFA 24 Ultimate Team (Div 1 + 92 OVR Squad)",
    description:
      "Stacked FIFA UT account with untradeable TOTY Mbappe, Gullit, and 500k coins remaining.",
    category: "accounts",
    price: 12000,
    imageUrl:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400",
    status: "active",
    createdAt: new Date(),
  },
  {
    id: "m-2",
    sellerId: "u-2",
    sellerName: "CyberNinja",
    title: "PS5 DualSense Edge Controller (Like New)",
    description:
      "Barely used pro controller with customizable back paddles and replacement thumbstick caps.",
    category: "hardware",
    price: 18000,
    imageUrl:
      "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=400",
    status: "active",
    createdAt: new Date(),
  },
  {
    id: "m-3",
    sellerId: "u-3",
    sellerName: "FalconEye",
    title: "CoD Mobile Mythic AK117 Account",
    description: "Level 200 account featuring 4 Mythic weapons and 12 Legendary operator skins.",
    category: "accounts",
    price: 15000,
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400",
    status: "active",
    createdAt: new Date(),
  },
];

export const mockRewards: Reward[] = [
  {
    id: "rw-1",
    title: "KES 1,000 M-Pesa Cash",
    pointsCost: 10000,
    description: "Direct cash deposit to your registered phone number.",
    category: "cash",
    claimable: true,
  },
  {
    id: "rw-2",
    title: "GameFlex VIP Badge (30 Days)",
    pointsCost: 2500,
    description: "Exclusive glowing border & chat badge across all lobbies.",
    category: "badge",
    claimable: true,
  },
  {
    id: "rw-3",
    title: "1x Free Tournament Entry Ticket",
    pointsCost: 1500,
    description: "Valid for any tournament with entry fee up to KES 500.",
    category: "ticket",
    claimable: true,
  },
];

export const mockSupportTickets: SupportTicket[] = [
  {
    id: "st-1",
    userId: "u-1",
    subject: "Match verification discrepancy",
    message: "Opponent submitted wrong screenshot for EA FC round 2.",
    status: "open",
    createdAt: new Date(),
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "n-1",
    userId: "u-1",
    title: "Match Ready",
    message: "Your tournament match for EA FC 24 Nairobi Championship is ready!",
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: "n-2",
    userId: "u-1",
    title: "Wallet Credited",
    message: "KES 1,500 has been added to your wallet via M-Pesa.",
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 2),
  },
];

export const mockAllUsers: User[] = [
  {
    id: "u-1",
    phone: "+254712345678",
    username: "ApexPredator",
    email: "apex@gameflex.app",
    gameHandle: "Apex_Viper",
    walletBalance: 4500,
    role: "admin",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "u-2",
    phone: "+254722334455",
    username: "CyberNinja",
    email: "ninja@gameflex.app",
    gameHandle: "Ninja_KE",
    walletBalance: 2800,
    role: "user",
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 2840,
  totalTournaments: 48,
  activeTournaments: 6,
  pendingPayments: 3,
  totalRevenue: 450000,
  todayRevenue: 12500,
  newUsersToday: 34,
  liveTournaments: 2,
};

export const mockRegistrations: Registration[] = [];
export const mockPayments: Payment[] = [];
export const mockMatches: Match[] = [];
