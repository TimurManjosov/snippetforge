"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResponseSchema = exports.UserResponseSchema = exports.TokenResponseSchema = void 0;
const zod_1 = require("zod");
exports.TokenResponseSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    tokenType: zod_1.z.literal('Bearer'),
    expiresIn: zod_1.z.number(),
});
exports.UserResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    username: zod_1.z.string(),
    bio: zod_1.z.string().nullable(),
    avatarUrl: zod_1.z.string().nullable(),
    role: zod_1.z.enum(['USER', 'ADMIN', 'MODERATOR']),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.AuthResponseSchema = zod_1.z.object({
    user: exports.UserResponseSchema,
    tokens: exports.TokenResponseSchema,
});
//# sourceMappingURL=auth-response.dto.js.map