"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = void 0;
exports.validateLoginDto = validateLoginDto;
exports.safeValidateLoginDto = safeValidateLoginDto;
const zod_1 = require("zod");
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .transform((val) => val.toLowerCase().trim()),
    password: zod_1.z.string().min(1, 'Password is required'),
});
function validateLoginDto(data) {
    return exports.LoginSchema.parse(data);
}
function safeValidateLoginDto(data) {
    return exports.LoginSchema.safeParse(data);
}
//# sourceMappingURL=login.dto.js.map