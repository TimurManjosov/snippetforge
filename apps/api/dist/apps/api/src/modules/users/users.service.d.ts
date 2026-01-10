import { UsersRepository } from './users.repository';
import { type CreateUserData, type FullUser, type SafeUser, type UpdateUserData } from './users.types';
export declare class UsersService {
    private readonly usersRepository;
    private readonly logger;
    constructor(usersRepository: UsersRepository);
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
    create(data: CreateUserData): Promise<SafeUser>;
    findById(id: string): Promise<SafeUser>;
    findByEmailWithPassword(email: string): Promise<FullUser | null>;
    findByEmail(email: string): Promise<SafeUser>;
    update(id: string, data: UpdateUserData): Promise<SafeUser>;
    changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    validateCredentials(email: string, password: string): Promise<SafeUser | null>;
}
