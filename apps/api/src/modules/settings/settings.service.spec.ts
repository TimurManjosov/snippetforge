import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsRepository } from './settings.repository';
import { SettingsService } from './settings.service';

const mockSettings = {
  defaultSnippetVisibility: false,
  defaultLanguage: null,
  uiTheme: 'system' as const,
  itemsPerPage: 20,
};

const createMockSettingsRepository = () => ({
  getByUserId: jest.fn(),
  update: jest.fn(),
});

describe('SettingsService', () => {
  let service: SettingsService;
  let repo: ReturnType<typeof createMockSettingsRepository>;

  beforeEach(async () => {
    repo = createMockSettingsRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: SettingsRepository,
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return settings when user exists', async () => {
      repo.getByUserId.mockResolvedValue(mockSettings);

      const result = await service.getMe('user-id-123');

      expect(repo.getByUserId).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(mockSettings);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.getByUserId.mockResolvedValue(undefined);

      await expect(
        service.getMe('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException with message "User not found"', async () => {
      repo.getByUserId.mockResolvedValue(undefined);

      await expect(
        service.getMe('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateMe', () => {
    it('should return updated settings for partial update (only uiTheme)', async () => {
      const updated = { ...mockSettings, uiTheme: 'dark' as const };
      repo.update.mockResolvedValue(updated);

      const result = await service.updateMe('user-id-123', { uiTheme: 'dark' });

      expect(repo.update).toHaveBeenCalledWith('user-id-123', {
        uiTheme: 'dark',
      });
      expect(result).toEqual(updated);
    });

    it('should allow setting defaultLanguage to null', async () => {
      const updated = { ...mockSettings, defaultLanguage: null };
      repo.update.mockResolvedValue(updated);

      const result = await service.updateMe('user-id-123', {
        defaultLanguage: null,
      });

      expect(result.defaultLanguage).toBeNull();
    });

    it('should throw NotFoundException when user does not exist (update returns undefined)', async () => {
      repo.update.mockResolvedValue(undefined);

      await expect(
        service.updateMe('00000000-0000-0000-0000-000000000000', {
          uiTheme: 'dark',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not throw for empty dto {}', async () => {
      repo.update.mockResolvedValue(mockSettings);

      const result = await service.updateMe('user-id-123', {});

      expect(result).toEqual(mockSettings);
    });
  });
});
