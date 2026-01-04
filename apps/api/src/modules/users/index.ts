// src/modules/users/index.ts

/**
 * Public API des UsersModule
 *
 * Was exportiert wird:
 * - UsersModule (für Imports in andere Module)
 * - UsersService (für Dependency Injection)
 * - Types (für Type Annotations)
 *
 * Was NICHT exportiert wird:
 * - UsersRepository (internes Implementierungsdetail)
 */

export { UsersModule } from './users.module';
export { UsersService } from './users.service';
export * from './users.types';
