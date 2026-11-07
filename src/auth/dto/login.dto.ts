import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginRequest {
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