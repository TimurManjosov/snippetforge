// src/modules/users/users.repository. ts

import { Injectable, Logger } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { users, type NewUser, type User } from '../../lib/db/schema';
import { DatabaseService } from '../../shared/database';

/**
 * UsersRepository - Data Access Layer für User-Entity
 *
 * VERANTWORTLICHKEITEN (Single Responsibility):
 * - Alle Datenbank-Queries für Users
 * - Keine Business Logic (kein Hashing, keine Validation)
 * - Keine HTTP-Concerns (keine Exceptions werfen)
 *
 * WARUM Repository Pattern?
 * 1. Testbarkeit: Repository kann gemockt werden
 * 2. Austauschbarkeit: DB-Wechsel betrifft nur Repository
 * 3. Klarheit: Service enthält nur Business Logic
 *
 * RETURN VALUES:
 * - Gefunden: User-Objekt
 * - Nicht gefunden: null (NICHT undefined!)
 * - Fehler: Exception wird geworfen (DB-Errors)
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Findet User anhand der ID
   *
   * @param id - UUID des Users
   * @returns User oder null wenn nicht gefunden
   */
  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${id}`);

    const result = await this.db.drizzle.query.users.findFirst({
      where: eq(users.id, id),
    });

    return result ?? null;
  }

  /**
   * Findet User anhand der Email
   * Verwendet für Login und Email-Uniqueness-Check
   *
   * @param email - Email-Adresse (case-insensitive durch DB)
   * @returns User oder null wenn nicht gefunden
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);

    const result = await this.db.drizzle.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    return result ?? null;
  }

  /**
   * Findet User anhand des Usernamens
   * Verwendet für Username-Uniqueness-Check
   *
   * @param username - Username (case-sensitive)
   * @returns User oder null wenn nicht gefunden
   */
  async findByUsername(username: string): Promise<User | null> {
    this.logger.debug(`Finding user by username: ${username}`);

    const result = await this.db.drizzle.query.users.findFirst({
      where: eq(users.username, username),
    });

    return result ?? null;
  }

  /**
   * Prüft ob Email ODER Username bereits existieren
   * Verwendet bei Registration um Duplikate zu verhindern
   *
   * @param email - Email zu prüfen
   * @param username - Username zu prüfen
   * @returns User wenn einer existiert, sonst null
   */
  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    this.logger.debug(
      `Checking if email or username exists: ${email}, ${username}`,
    );

    const result = await this.db.drizzle.query.users.findFirst({
      where: or(
        eq(users.email, email.toLowerCase()),
        eq(users.username, username),
      ),
    });

    return result ?? null;
  }

  /**
   * Erstellt neuen User in der Datenbank
   *
   * WICHTIG:
   * - data.passwordHash muss BEREITS gehasht sein!
   * - Email wird automatisch lowercase gespeichert
   *
   * @param data - User-Daten (mit passwordHash, NICHT password!)
   * @returns Erstellter User
   * @throws Bei Constraint-Violation (Duplicate Email/Username)
   */
  async create(data: NewUser): Promise<User> {
    this.logger.debug(`Creating new user: ${data.email}`);

    const [newUser] = await this.db.drizzle
      .insert(users)
      .values({
        ...data,
        email: data.email.toLowerCase(), // Normalisierung
      })
      .returning();

    this.logger.log(`User created successfully: ${newUser.id}`);
    return newUser;
  }

  /**
   * Aktualisiert User-Daten
   *
   * @param id - UUID des Users
   * @param data - Zu aktualisierende Felder
   * @returns Aktualisierter User oder null wenn nicht gefunden
   */
  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    this.logger.debug(`Updating user: ${id}`);

    const [updatedUser] = await this.db.drizzle
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(), // Timestamp aktualisieren
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      this.logger.warn(`User not found for update: ${id}`);
      return null;
    }

    this.logger.log(`User updated successfully: ${id}`);
    return updatedUser;
  }

  /**
   * Aktualisiert nur das Passwort eines Users
   * Separatiert von update() für Klarheit und Audit-Logging
   *
   * @param id - UUID des Users
   * @param passwordHash - Neuer Password Hash (BEREITS gehasht!)
   * @returns true wenn erfolgreich, false wenn User nicht gefunden
   */
  async updatePassword(id: string, passwordHash: string): Promise<boolean> {
    this.logger.debug(`Updating password for user: ${id}`);

    const result = await this.db.drizzle
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (result.length === 0) {
      this.logger.warn(`User not found for password update: ${id}`);
      return false;
    }

    this.logger.log(`Password updated successfully for user: ${id}`);
    return true;
  }

  /**
   * Löscht User (Hard Delete)
   *
   * WARNUNG: In Production besser Soft Delete verwenden!
   * (isDeleted Flag statt echtem Löschen)
   *
   * @param id - UUID des Users
   * @returns true wenn gelöscht, false wenn nicht gefunden
   */
  async delete(id: string): Promise<boolean> {
    this.logger.debug(`Deleting user: ${id}`);

    const result = await this.db.drizzle
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (result.length === 0) {
      this.logger.warn(`User not found for deletion: ${id}`);
      return false;
    }

    this.logger.log(`User deleted successfully: ${id}`);
    return true;
  }

  /**
   * Zählt alle User (für Admin-Dashboard)
   *
   * @returns Anzahl der User
   */
  async count(): Promise<number> {
    const result = await this.db.drizzle
      .select({ count: users.id })
      .from(users);

    // Drizzle gibt Array zurück, wir brauchen Länge
    return result.length;
  }
}
