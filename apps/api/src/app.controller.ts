import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { UsersService } from './modules/users';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly usersService: UsersService, // ← Hinzufügen
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
