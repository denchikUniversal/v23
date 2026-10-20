import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { StartWith } from "../decorators/start-with.decorator";

export enum TaskTag {
  WORK = 'work',
  PERSONAL = 'personal',
  URGENT = 'urgent',
  LOW_PRIORITY = 'low-priority',
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  // @StartWith('Task:', { message: 'Title must start with "Task: "' }) custom decorator
  @MinLength(3)
  title: string; 

  @IsString()
  @IsOptional()
  description: string;

  @IsArray()
  // @IsString({each: true})
  @IsEnum(TaskTag, { each: true })
  @IsOptional()
  tags: TaskTag[];

  @IsBoolean()
  isCompleted: boolean;
}