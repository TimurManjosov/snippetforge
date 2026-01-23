import { Test, TestingModule } from '@nestjs/testing';
import { RegisterSchema } from '../../../packages/shared/src/auth.schemas';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('testValidation', () => {
    it('should validate data successfully', () => {
      const result = appService.testValidation();
      expect(result).toBe('Valid!');
    });

    it('should return validation error details on failure', () => {
      const safeParseSpy = jest
        .spyOn(RegisterSchema, 'safeParse')
        .mockReturnValue({ success: false, error: 'Invalid payload' } as any);

      const result = appService.testValidation();

      expect(result).toBe('Invalid payload');

      safeParseSpy.mockRestore();
    });
  });
});
