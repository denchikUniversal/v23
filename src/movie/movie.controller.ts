import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { FilterMovieDto } from './dto/filter-movie.dto';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  findAll(@Query() filters: FilterMovieDto) {
    return this.movieService.findAll(filters);
  }

  @Post()
  create(@Body() movie: CreateMovieDto) {
    return this.movieService.create(movie);
  }
}
