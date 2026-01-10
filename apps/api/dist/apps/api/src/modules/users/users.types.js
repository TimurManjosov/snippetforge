"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeUser = toSafeUser;
exports.toFullUser = toFullUser;
function toSafeUser(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function toFullUser(user) {
    return {
        ...toSafeUser(user),
        passwordHash: user.passwordHash,
    };
}
//# sourceMappingURL=users.types.js.map