"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const users_repository_1 = require("./users.repository");
const users_types_1 = require("./users.types");
const BCRYPT_ROUNDS = 10;
let UsersService = UsersService_1 = class UsersService {
    usersRepository;
    logger = new common_1.Logger(UsersService_1.name);
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    async create(data) {
        this.logger.debug(`Creating user: ${data.email}`);
        const normalizedEmail = data.email.toLowerCase();
        const existingUser = await this.usersRepository.findByEmailOrUsername(normalizedEmail, data.username);
        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                throw new common_1.ConflictException('Email is already registered');
            }
            throw new common_1.ConflictException('Username is already taken');
        }
        const passwordHash = await this.hashPassword(data.password);
        const user = await this.usersRepository.create({
            email: normalizedEmail,
            username: data.username,
            passwordHash,
        });
        this.logger.log(`User created: ${user.id}`);
        return (0, users_types_1.toSafeUser)(user);
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return (0, users_types_1.toSafeUser)(user);
    }
    async findByEmailWithPassword(email) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            return null;
        }
        return (0, users_types_1.toFullUser)(user);
    }
    async findByEmail(email) {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException(`User with email ${email} not found`);
        }
        return (0, users_types_1.toSafeUser)(user);
    }
    async update(id, data) {
        this.logger.debug(`Updating user: ${id}`);
        const existingUser = await this.usersRepository.findById(id);
        if (!existingUser) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        if (data.username && data.username !== existingUser.username) {
            const userWithSameUsername = await this.usersRepository.findByUsername(data.username);
            if (userWithSameUsername && userWithSameUsername.id !== id) {
                throw new common_1.ConflictException('Username is already taken');
            }
        }
        const updatedUser = await this.usersRepository.update(id, data);
        if (!updatedUser) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        this.logger.log(`User updated: ${id}`);
        return (0, users_types_1.toSafeUser)(updatedUser);
    }
    async changePassword(id, currentPassword, newPassword) {
        this.logger.debug(`Changing password for user: ${id}`);
        const user = await this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.ConflictException('Current password is incorrect');
        }
        const newPasswordHash = await this.hashPassword(newPassword);
        await this.usersRepository.updatePassword(id, newPasswordHash);
        this.logger.log(`Password changed for user: ${id}`);
        return true;
    }
    async delete(id) {
        this.logger.debug(`Deleting user: ${id}`);
        const deleted = await this.usersRepository.delete(id);
        if (!deleted) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        this.logger.log(`User deleted: ${id}`);
        return true;
    }
    async validateCredentials(email, password) {
        const user = await this.findByEmailWithPassword(email);
        if (!user) {
            await this.comparePassword(password, '$2b$10$tfim3AUyYJJ.b1Cjz4jUn.NJ4JiCMCJYS7FotrpAKOAk2r6rjrQDe');
            return null;
        }
        const isPasswordValid = await this.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return null;
        }
        return (0, users_types_1.toSafeUser)(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map