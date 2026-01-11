import { type SafeUser } from '../users';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export interface TokenResponse {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
}
export interface AuthResponse {
    user: SafeUser;
    tokens: TokenResponse;
}
export interface AuthenticatedRequest extends Request {
    user: SafeUser;
}
export interface DecodedJwtToken extends JwtPayload {
    iat: number;
    exp: number;
}
