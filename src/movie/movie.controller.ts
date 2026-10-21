import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieDto } from './dto/movie.dto';
import { FilterMovieDto } from './dto/filter-movie.dto';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  findAll(@Query() filters: FilterMovieDto) {
    return this.movieService.findAll(filters);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.movieService.findById(id);
  }

  @Post()
  create(@Body() movie: MovieDto) {
    return this.movieService.create(movie);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() movie: MovieDto) {
    return this.movieService.update(id, movie);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.movieService.delete(id);
  }
}
