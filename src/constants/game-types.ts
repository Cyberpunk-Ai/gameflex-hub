export const GAME_TYPES = [
  { id: "fifa", label: "EA FC (FIFA)", icon: "gamepad" },
  { id: "cod", label: "Call of Duty", icon: "crosshair" },
  { id: "pubg", label: "PUBG Mobile", icon: "smartphone" },
  { id: "fortnite", label: "Fortnite", icon: "target" },
  { id: "apex", label: "Apex Legends", icon: "crosshair" },
  { id: "valorant", label: "Valorant", icon: "crosshair" },
  { id: "other", label: "Other", icon: "joystick" },
] as const;

export const TOURNAMENT_FORMATS = [
  "single_elimination",
  "double_elimination",
  "round_robin",
  "swiss",
] as const;

export const TOURNAMENT_STATUSES = [
  "upcoming",
  "registration_open",
  "registration_closed",
  "live",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_METHODS = ["mpesa"] as const;

export const PAYMENT_STATUSES = ["pending", "verified", "rejected", "refunded"] as const;

export const REGISTRATION_STATUSES = ["pending", "confirmed", "cancelled", "checked_in"] as const;

export const PLATFORM_TYPES = ["ps4", "ps5", "xbox", "mobile", "pc"] as const;

export const LISTING_CATEGORIES = [
  "skins",
  "accounts",
  "items",
  "currency",
  "services",
  "other",
] as const;
