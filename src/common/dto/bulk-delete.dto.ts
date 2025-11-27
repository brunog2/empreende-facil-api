import { IsArray, IsUUID } from 'class-validator';

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}

