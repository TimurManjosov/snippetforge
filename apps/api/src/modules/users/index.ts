// src/modules/users/index.ts

/**
 * Public API des UsersModule
 *
 * Was exportiert wird:
 * - UsersModule (für Imports in andere Module)
 * - UsersController (für HTTP Endpoints)
 * - UsersService (für Dependency Injection)
 * - UsersRepository (für DI in other modules)
 * - Types (für Type Annotations)
 * - DTOs (für Validation)
 */

export { UsersModule } from './users.module';
export { UsersController } from './users.controller';
export { UsersService } from './users.service';
export { UsersRepository } from './users.repository';
export * from './users.types';
export * from './dto';
