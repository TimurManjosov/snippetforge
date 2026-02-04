export type UserRole = "USER" | "ADMIN" | "MODERATOR";

export interface SafeUser {
  id: string;
  email: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface AuthResponse {
  user: SafeUser;
  tokens: TokenResponse;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
