"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../lib/db/schema");
const database_1 = require("../../shared/database");
let UsersRepository = UsersRepository_1 = class UsersRepository {
    db;
    logger = new common_1.Logger(UsersRepository_1.name);
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        this.logger.debug(`Finding user by ID: ${id}`);
        const result = await this.db.drizzle.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, id),
        });
        return result ?? null;
    }
    async findByEmail(email) {
        this.logger.debug(`Finding user by email: ${email}`);
        const result = await this.db.drizzle.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, email.toLowerCase()),
        });
        return result ?? null;
    }
    async findByUsername(username) {
        this.logger.debug(`Finding user by username: ${username}`);
        const result = await this.db.drizzle.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.username, username),
        });
        return result ?? null;
    }
    async findByEmailOrUsername(email, username) {
        this.logger.debug(`Checking if email or username exists: ${email}, ${username}`);
        const result = await this.db.drizzle.query.users.findFirst({
            where: (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.users.email, email.toLowerCase()), (0, drizzle_orm_1.eq)(schema_1.users.username, username)),
        });
        return result ?? null;
    }
    async create(data) {
        this.logger.debug(`Creating new user: ${data.email}`);
        const [newUser] = await this.db.drizzle
            .insert(schema_1.users)
            .values({
            ...data,
            email: data.email.toLowerCase(),
        })
            .returning();
        this.logger.log(`User created successfully: ${newUser.id}`);
        return newUser;
    }
    async update(id, data) {
        this.logger.debug(`Updating user: ${id}`);
        const [updatedUser] = await this.db.drizzle
            .update(schema_1.users)
            .set({
            ...data,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (!updatedUser) {
            this.logger.warn(`User not found for update: ${id}`);
            return null;
        }
        this.logger.log(`User updated successfully: ${id}`);
        return updatedUser;
    }
    async updatePassword(id, passwordHash) {
        this.logger.debug(`Updating password for user: ${id}`);
        const result = await this.db.drizzle
            .update(schema_1.users)
            .set({
            passwordHash,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning({ id: schema_1.users.id });
        if (result.length === 0) {
            this.logger.warn(`User not found for password update: ${id}`);
            return false;
        }
        this.logger.log(`Password updated successfully for user: ${id}`);
        return true;
    }
    async delete(id) {
        this.logger.debug(`Deleting user: ${id}`);
        const result = await this.db.drizzle
            .delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning({ id: schema_1.users.id });
        if (result.length === 0) {
            this.logger.warn(`User not found for deletion: ${id}`);
            return false;
        }
        this.logger.log(`User deleted successfully: ${id}`);
        return true;
    }
    async count() {
        const result = await this.db.drizzle
            .select({ count: schema_1.users.id })
            .from(schema_1.users);
        return result.length;
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = UsersRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map