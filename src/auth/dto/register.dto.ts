import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterRequest {
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'test@gmail.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}