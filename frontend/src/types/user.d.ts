/**
 * User Identity, Address, and Profile Type Definitions
 */

export type UserRole = "user" | "staff" | "admin";

export interface User {
  id: number;
  ID?: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  is_default: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

