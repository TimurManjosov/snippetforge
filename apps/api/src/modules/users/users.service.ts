// src/modules/users/users.service.ts

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import {
  type CreateUserData,
  type FullUser,
  type SafeUser,
  type UpdateUserData,
  toFullUser,
  toSafeUser,
} from './users.types';

/**
 * UsersService - Business Logic für User-Operationen
 *
 * VERANTWORTLICHKEITEN (Single Responsibility):
 * - Password Hashing/Verification
 * - Business Rules (z.B. "Email muss unique sein")
 * - Koordination zwischen Repository und anderen Services
 * - Transformation (DB-Entity → SafeUser)
 *
 * WAS HIER NICHT PASSIERT:
 * - Direkte DB-Queries (→ Repository)
 * - HTTP Response Formatting (→ Controller)
 * - Input Validation (→ Zod Pipes)
 *
 * SECURITY:
 * - Passwords werden HIER gehasht, nicht im Repository
 * - passwordHash wird NIE nach außen gegeben (SafeUser)
 * - Timing-Safe Comparison bei Password-Checks
 */

// Bcrypt Konfiguration
// 10 Rounds = ~100ms pro Hash auf modernem CPU
// Guter Kompromiss zwischen Security und Performance
const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  // ============================================================
  // PASSWORD HASHING
  // ============================================================

  /**
   * Hasht ein Klartext-Passwort mit bcrypt
   *
   * WARUM bcrypt?
   * - CPU-bound (verhindert GPU-Brute-Force)
   * - Eingebautes Salting (jeder Hash ist unique)
   * - Industrie-Standard seit >10 Jahren
   *
   * WARUM 10 Rounds?
   * - <10:  Zu schnell, leichter zu bruteforcen
   * - >12: Zu langsam, schlechte UX bei Login
   * - 10: ~100ms, guter Kompromiss
   *
   * @param password - Klartext-Passwort
   * @returns Gehashtes Passwort (60 Zeichen)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Vergleicht Klartext-Passwort mit Hash
   *
   * SECURITY: bcrypt. compare ist timing-safe
   * (verhindert Timing-Attacks)
   *
   * @param password - Klartext-Passwort vom User
   * @param hash - Gespeicherter Hash aus DB
   * @returns true wenn Match, false wenn nicht
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ============================================================
  // USER CRUD OPERATIONS
  // ============================================================

  /**
   * Erstellt neuen User
   *
   * BUSINESS RULES:
   * 1. Email muss unique sein
   * 2. Username muss unique sein
   * 3. Password wird gehasht gespeichert
   *
   * @param data - CreateUserData (email, username, password)
   * @returns SafeUser (ohne passwordHash!)
   * @throws ConflictException wenn Email/Username existiert
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    this.logger.debug(`Creating user: ${data.email}`);

    // 1. Prüfe ob Email oder Username bereits existieren
    const existingUser = await this.usersRepository.findByEmailOrUsername(
      data.email,
      data.username,
    );

    if (existingUser) {
      // Spezifische Fehlermeldung (aber nicht zu spezifisch - Security!)
      if (existingUser.email === data.email.toLowerCase()) {
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Username is already taken');
    }

    // 2. Password hashen
    const passwordHash = await this.hashPassword(data.password);

    // 3. User erstellen
    const user = await this.usersRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
    });

    this.logger.log(`User created: ${user.id}`);

    // 4. SafeUser zurückgeben (OHNE passwordHash!)
    return toSafeUser(user);
  }

  /**
   * Findet User anhand der ID
   * Gibt SafeUser zurück (ohne passwordHash)
   *
   * @param id - UUID des Users
   * @returns SafeUser
   * @throws NotFoundException wenn User nicht existiert
   */
  async findById(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return toSafeUser(user);
  }

  /**
   * Findet User anhand der Email
   * Gibt FullUser zurück (MIT passwordHash)
   *
   * NUR FÜR AUTHENTICATION VERWENDEN!
   * Niemals in API Response zurückgeben!
   *
   * @param email - Email-Adresse
   * @returns FullUser oder null wenn nicht gefunden
   */
  async findByEmailWithPassword(email: string): Promise<FullUser | null> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    return toFullUser(user);
  }

  /**
   * Findet User anhand der Email
   * Gibt SafeUser zurück (ohne passwordHash)
   *
   * @param email - Email-Adresse
   * @returns SafeUser
   * @throws NotFoundException wenn User nicht existiert
   */
  async findByEmail(email: string): Promise<SafeUser> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return toSafeUser(user);
  }

  /**
   * Aktualisiert User-Profil
   *
   * @param id - UUID des Users
   * @param data - Zu aktualisierende Felder
   * @returns Aktualisierter SafeUser
   * @throws NotFoundException wenn User nicht existiert
   */
  async update(id: string, data: UpdateUserData): Promise<SafeUser> {
    this.logger.debug(`Updating user: ${id}`);

    // Prüfe ob User existiert
    const existingUser = await this.usersRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Update durchführen
    const updatedUser = await this.usersRepository.update(id, data);

    // Sollte nie null sein (wir haben gerade geprüft), aber Defensive Programming
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User updated: ${id}`);
    return toSafeUser(updatedUser);
  }

  /**
   * Ändert User-Passwort
   *
   * SECURITY:
   * - Altes Passwort muss korrekt sein
   * - Neues Passwort wird gehasht
   *
   * @param id - UUID des Users
   * @param currentPassword - Aktuelles Passwort (Klartext)
   * @param newPassword - Neues Passwort (Klartext)
   * @returns true wenn erfolgreich
   * @throws NotFoundException wenn User nicht existiert
   * @throws ConflictException wenn aktuelles Passwort falsch
   */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    this.logger.debug(`Changing password for user: ${id}`);

    // 1. User mit passwordHash laden
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // 2. Aktuelles Passwort prüfen
    const isCurrentPasswordValid = await this.comparePassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    // 3. Neues Passwort hashen und speichern
    const newPasswordHash = await this.hashPassword(newPassword);
    await this.usersRepository.updatePassword(id, newPasswordHash);

    this.logger.log(`Password changed for user: ${id}`);
    return true;
  }

  /**
   * Löscht User
   *
   * @param id - UUID des Users
   * @returns true wenn erfolgreich
   * @throws NotFoundException wenn User nicht existiert
   */
  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting user: ${id}`);

    const deleted = await this.usersRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User deleted: ${id}`);
    return true;
  }

  // ============================================================
  // VALIDATION HELPERS (für AuthService)
  // ============================================================

  /**
   * Validiert User-Credentials
   * Verwendet bei Login
   *
   * SECURITY:
   * - Gibt null zurück bei JEDEM Fehler (Email nicht gefunden ODER Password falsch)
   * - Verhindert User Enumeration
   *
   * @param email - Email-Adresse
   * @param password - Klartext-Passwort
   * @returns SafeUser wenn valide, null wenn nicht
   */
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    // 1. User laden (mit passwordHash)
    const user = await this.findByEmailWithPassword(email);

    if (!user) {
      // User nicht gefunden - aber wir verraten das nicht!
      // Stattdessen führen wir trotzdem einen Hash-Vergleich durch
      // (verhindert Timing-Attacks)
      await this.hashPassword('dummy-password');
      return null;
    }

    // 2. Password vergleichen
    const isPasswordValid = await this.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    // 3. SafeUser zurückgeben (ohne passwordHash!)
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
}
