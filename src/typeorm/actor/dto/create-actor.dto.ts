import { IsString } from "class-validator";

export class CreateActorDTO {
  @IsString()
  name: string;
}