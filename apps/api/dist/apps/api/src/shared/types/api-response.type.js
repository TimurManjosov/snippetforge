"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuccessResponse = isSuccessResponse;
exports.isErrorResponse = isErrorResponse;
function isSuccessResponse(response) {
    return response.success === true;
}
function isErrorResponse(response) {
    return response.success === false;
}
//# sourceMappingURL=api-response.type.js.map