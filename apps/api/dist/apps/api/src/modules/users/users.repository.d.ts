import { type NewUser, type User } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';
export declare class UsersRepository {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmailOrUsername(email: string, username: string): Promise<User | null>;
    create(data: NewUser): Promise<User>;
    update(id: string, data: Partial<NewUser>): Promise<User | null>;
    updatePassword(id: string, passwordHash: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    count(): Promise<number>;
}
