export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",
  dark: "#0F172A",
  card: "#FFFFFF",
  background: "#F8FAFC",
  border: "#E2E8F0",
  text: "#0F172A",
  subtext: "#64748B",
  success: "#16A34A",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  danger: "#DC2626",
  dangerLight: "#FEE2E2",
  muted: "#94A3B8",
  ink: "#0B1220",
  inkLight: "#F1F5F9",
  sky: "#0EA5E9",
  skyLight: "#E0F2FE",
  violet: "#7C3AED",
  violetLight: "#EDE9FE",
  emerald: "#10B981",
  emeraldLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  rose: "#F43F5E",
  roseLight: "#FFE4E6",
  teal: "#14B8A6",
  tealLight: "#CCFBF1",
} as const;

export const gradients = {
  hero: ["#0F172A", "#1E3A8A", "#2563EB"] as const,
  primary: ["#3B82F6", "#2563EB", "#1D4ED8"] as const,
  sky: ["#0EA5E9", "#2563EB"] as const,
  violet: ["#7C3AED", "#4F46E5"] as const,
  emerald: ["#10B981", "#059669"] as const,
  amber: ["#F59E0B", "#EA580C"] as const,
  rose: ["#F43F5E", "#BE123C"] as const,
  teal: ["#14B8A6", "#0D9488"] as const,
  ink: ["#020617", "#0F172A"] as const,
  card: ["#FFFFFF", "#E0EAFE"] as const,
} as const;

export const shadows = {
  sm: { shadowColor: "#0F172A", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 } as const,
  md: { shadowColor: "#0F172A", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 } as const,
  lg: { shadowColor: "#1E3A8A", shadowOpacity: 0.2, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 } as const,
  glow: { shadowColor: "#2563EB", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 } as const,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;