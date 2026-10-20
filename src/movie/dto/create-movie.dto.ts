import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1888, { message: 'Release year must be greater than or equal to 1888' })
  @Max(new Date().getFullYear(), { message: 'Release year must be less than or equal to the current year' })
  releaseYear: number;
}