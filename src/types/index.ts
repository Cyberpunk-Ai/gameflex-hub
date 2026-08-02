// User Types
export interface User {
  id: string;
  phone: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  gameHandle?: string;
  walletBalance: number;
  role: "user" | "admin";
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tournament Types
export type TournamentStatus =
  "upcoming" | "registration_open" | "registration_closed" | "live" | "completed" | "cancelled";
export type TournamentFormat =
  "single_elimination" | "double_elimination" | "round_robin" | "swiss";
export type GameType = "fifa" | "cod" | "pubg" | "fortnite" | "apex" | "valorant" | "other";

export interface Tournament {
  id: string;
  title: string;
  description: string;
  game: GameType;
  format: TournamentFormat;
  status: TournamentStatus;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  startDate: Date;
  endDate?: Date;
  registrationDeadline: Date;
  rules: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Registration Types
export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "checked_in";

export interface Registration {
  id: string;
  tournamentId: string;
  userId: string;
  status: RegistrationStatus;
  paymentId?: string;
  gameHandle: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export type PaymentStatus = "pending" | "verified" | "rejected" | "refunded";
export type PaymentMethod = "mpesa";

export interface Payment {
  id: string;
  userId: string;
  tournamentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionCode?: string;
  screenshotUrl?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Match Types
export type MatchStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  player1Score?: number;
  player2Score?: number;
  winnerId?: string;
  status: MatchStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Bracket Types
export interface BracketMatch extends Match {
  player1?: User;
  player2?: User;
  winner?: User;
}

export interface Bracket {
  tournamentId: string;
  rounds: BracketMatch[][];
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  /** snake_case alias used by Supabase rows / fixtures */
  user_id?: string;
  username: string;
  avatarUrl?: string;
  gameHandle?: string;
  game_handle?: string;
  wins?: number;
  losses?: number;
  points: number;
  earnings?: number;
  tournamentsPlayed?: number;
}

// Marketplace Types
export type ListingStatus = "active" | "sold" | "cancelled";
export type ListingCategory = "account" | "accounts" | "items" | "hardware" | "coaching" | "other";

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName?: string;
  title: string;
  description: string;
  category: ListingCategory;
  price: number;
  imageUrl?: string;
  status: ListingStatus;
  createdAt: Date;
  updatedAt?: Date;
}

// Support Ticket Types
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description?: string;
  /** first message body, used by fixtures / list views */
  message?: string;
  status: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isStaff: boolean;
  createdAt: Date;
}

// Notification Types
export type NotificationType = "tournament" | "payment" | "match" | "system" | "whatsapp";

export interface Notification {
  id: string;
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number;
  totalTournaments: number;
  activeTournaments: number;
  pendingPayments: number;
  totalRevenue: number;
  todayRevenue: number;
  newUsersToday: number;
  liveTournaments: number;
}

// WhatsApp Automation Types
export interface WhatsAppMessage {
  id: string;
  userId: string;
  phone: string;
  type: "registration" | "reminder" | "result" | "promotion";
  message: string;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  createdAt: Date;
}

// Game Room Types
export interface GameRoom {
  id: string;
  name?: string;
  game?: GameType | string;
  hostId?: string;
  hostName?: string;
  entryFee?: number;
  maxPlayers?: number;
  currentPlayers?: number;
  status?: "waiting" | "in_progress" | "completed" | "cancelled";
  tournamentId?: string;
  matchId?: string;
  roomCode?: string;
  password?: string;
  platform?: "playstation" | "xbox" | "pc" | "mobile";
  createdAt: Date;
  expiresAt?: Date;
}

// Reward Types
export interface Reward {
  id: string;
  userId?: string;
  tournamentId?: string;
  type?: "prize" | "bonus" | "referral" | "achievement";
  title?: string;
  pointsCost?: number;
  category?: string;
  claimable?: boolean;
  amount?: number;
  description: string;
  status?: "pending" | "claimed" | "expired";
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
}
