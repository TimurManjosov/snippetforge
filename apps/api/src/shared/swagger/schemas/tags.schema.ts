import { ApiProperty } from '@nestjs/swagger';

export class CreateTagRequestSchema {
  @ApiProperty({
    description: 'Tag display name',
    example: 'TypeScript',
    maxLength: 50,
  })
  name: string;
}

export class TagResponseSchema {
  @ApiProperty({
    description: 'Tag unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Tag display name',
    example: 'TypeScript',
  })
  name: string;

  @ApiProperty({
    description: 'Tag slug',
    example: 'typescript',
  })
  slug: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-17T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Number of snippets using this tag',
    example: 12,
  })
  snippetCount: number;
}

export class AttachTagsRequestSchema {
  @ApiProperty({
    description: 'Tag names or slugs to attach',
    type: [String],
    example: ['TypeScript', 'backend'],
  })
  tags: string[];
}

export class AttachTagsResponseSchema {
  @ApiProperty({
    description: 'Number of new relations attached',
    example: 2,
  })
  attached: number;

  @ApiProperty({
    description: 'Requested tag count after normalization and dedupe',
    example: 2,
  })
  totalRequested: number;

  @ApiProperty({
    description: 'Resolved existing tag slugs',
    type: [String],
    example: ['typescript', 'backend'],
  })
  resolvedTags: string[];
}

export class RemoveTagResponseSchema {
  @ApiProperty({
    description: 'Tag relation removed successfully',
    example: true,
  })
  removed: true;
}
