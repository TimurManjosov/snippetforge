"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterSchema = void 0;
exports.validateRegisterDto = validateRegisterDto;
exports.safeValidateRegisterDto = safeValidateRegisterDto;
const zod_1 = require("zod");
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Invalid email format')
        .max(255, 'Email must be at most 255 characters')
        .transform((val) => val.toLowerCase().trim()),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores')
        .transform((val) => val.trim()),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be at most 100 characters')
        .regex(PASSWORD_REGEX, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});
function validateRegisterDto(data) {
    return exports.RegisterSchema.parse(data);
}
function safeValidateRegisterDto(data) {
    return exports.RegisterSchema.safeParse(data);
}
//# sourceMappingURL=register.dto.js.map