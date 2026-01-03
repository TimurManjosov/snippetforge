import { Injectable } from '@nestjs/common';
import { RegisterSchema } from '../../../packages/shared/src/auth.schemas';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  // ✅ Nutze RegisterSchema
  testValidation() {
    const testData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'SecurePass123',
    };

    const result = RegisterSchema.safeParse(testData);
    return result.success ? 'Valid!' : result.error;
  }
}
