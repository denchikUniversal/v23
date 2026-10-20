import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity) 
    private readonly movieRepository: Repository<MovieEntity>
  ) {}

  async findAll(): Promise<MovieEntity[]> {
    return await this.movieRepository.find({
      order: {
        createdAt: 'desc',
      },
      // where: {
      //   isPublic: true,
      // },
      // take: 10,
      // select: {
      //   id: true,
      //   title: true,
      //   releaseYear: true,
      //   createdAt: true,
      // },

    });
  }

  async create(movie: CreateMovieDto): Promise<MovieEntity> {
    const newMovie = this.movieRepository.create(movie);
    return await this.movieRepository.save(newMovie);
  }
}
