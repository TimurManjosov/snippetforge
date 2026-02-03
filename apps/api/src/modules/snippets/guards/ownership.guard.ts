// src/modules/snippets/guards/ownership.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { type SafeUser } from '../../users';
import { SnippetsRepository } from '../snippets.repository';
import { type Snippet } from '../snippets.types';

interface OwnershipRequest extends Request {
  user?: SafeUser;
  snippet?: Snippet;
  params: {
    id: string;
  };
}

/**
 * OwnershipGuard - Prüft Snippet Ownership oder ADMIN Rolle
 *
 * Regelt Schreibzugriffe (Update/Delete) für Snippets:
 * - Owner oder ADMIN → erlaubt
 * - Nicht gefunden oder kein Zugriff → 404 Not Found
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(private readonly snippetsRepository: SnippetsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OwnershipRequest>();
    const user = request.user;

    if (!user) {
      this.logger.error(
        'OwnershipGuard: No user found in request. JwtAuthGuard missing?',
      );
      throw new NotFoundException();
    }

    const snippetId = request.params.id;
    const snippet = await this.snippetsRepository.findById(snippetId);

    if (!snippet) {
      throw new NotFoundException();
    }

    if (user.role === 'ADMIN' || snippet.userId === user.id) {
      request.snippet = snippet;
      return true;
    }

    throw new NotFoundException();
  }
}
