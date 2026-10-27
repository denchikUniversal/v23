import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entities/movie.entity';
import { Between, FindOptionsWhere, ILike, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { MovieDto } from './dto/movie.dto';
import { FilterMovieDto } from './dto/filter-movie.dto';
import { ActorEntity } from '../actor/entities/actor.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity) 
    private readonly movieRepository: Repository<MovieEntity>,
    @InjectRepository(ActorEntity) 
    private readonly actorRepository: Repository<ActorEntity>
  ) {}

  async findAll(filters: FilterMovieDto) {
    const {
      search,
      yearFrom,
      yearTo,
      isAvailable,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = filters;

    // Собираем where через if: в TypeORM 1.x undefined/null в where по умолчанию бросает ошибку
    const where: FindOptionsWhere<MovieEntity> = {};

    if (search) where.title = ILike(`%${search}%`);
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

    if (yearFrom !== undefined && yearTo !== undefined) where.releaseYear = Between(yearFrom, yearTo);
    else if (yearFrom !== undefined) where.releaseYear = MoreThanOrEqual(yearFrom);
    else if (yearTo !== undefined) where.releaseYear = LessThanOrEqual(yearTo);

    const [items, total] = await this.movieRepository.findAndCount({
      where,
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        releaseYear: true,
        isAvailable: true,
        createdAt: true,
        releaseDate: true,
        genre: true,
        reviews: true,
      },
      relations: {
        reviews: true,
        actors: true,
      }
    });

    return { items, meta: this.getMeta(total, page, limit) };
  }

  async findById(id: string): Promise<MovieEntity> {
    const movie = await this.movieRepository.findOne(
      { 
        where: { id }, 
        relations: {
          reviews: true,
          actors: true,
        }, 
      }
    );
    if (!movie) {
      throw new NotFoundException('Movie not found');
    }
    return movie;
  }

  async create(movie: MovieDto): Promise<MovieEntity> {
    const {title, releaseYear, actorIds, description} = movie;

    const actors = await this.actorRepository.find({
      where: {
        id: In(actorIds)
      }
    })

    if (!actors || !actors.length) throw new NotFoundException();

    const newMovie = this.movieRepository.create({
      title,
      releaseYear,
      description,
      actors,
    });

    return await this.movieRepository.save(newMovie);
  }

  async update(id: string, movie: MovieDto): Promise<MovieEntity> {
    const existingMovie = await this.findById(id);
    Object.assign(existingMovie, movie);
    return await this.movieRepository.save(existingMovie);
  }

  async delete(id: string): Promise<void> {
    const existingMovie = await this.findById(id);
    await this.movieRepository.remove(existingMovie);
  }

  getMeta(total: number, page: number, limit: number) {
    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}
