import { IsString, IsNotEmpty, IsNumber, Min, Max, IsUUID } from "class-validator";

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;

  @IsUUID()
  movieId: string;
}