import { type User } from '../../lib/db/schema';
export interface SafeUser {
    id: string;
    email: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN' | 'MODERATOR';
    createdAt: Date;
    updatedAt: Date;
}
export interface FullUser extends SafeUser {
    passwordHash: string;
}
export interface CreateUserData {
    email: string;
    username: string;
    password: string;
}
export interface UpdateUserData {
    username?: string;
    bio?: string;
    avatarUrl?: string;
}
export interface UpdatePasswordData {
    currentPassword: string;
    newPassword: string;
}
export declare function toSafeUser(user: User): SafeUser;
export declare function toFullUser(user: User): FullUser;
