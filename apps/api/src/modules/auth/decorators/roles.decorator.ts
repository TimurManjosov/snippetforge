// src/modules/auth/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata Key für @Roles() Decorator
 * Wird von RolesGuard gelesen
 */
export const ROLES_KEY = 'roles';

/**
 * Erlaubte Rollen (aus DB Schema)
 * Type-Safety: Nur diese Werte können übergeben werden
 */
export type Role = 'USER' | 'ADMIN' | 'MODERATOR';

/**
 * @Roles() Decorator - Definiert welche Rollen Zugriff haben
 *
 * VERWENDUNG:
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * deleteUser() {}
 *
 * // Mehrere Rollen (OR - eine reicht)
 * @Roles('ADMIN', 'MODERATOR')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * moderateContent() {}
 *
 * WICHTIG: Immer mit RolesGuard kombinieren!
 * @Roles() alleine macht nichts.
 *
 * @param roles - Erlaubte Rollen (mindestens eine muss User haben)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
