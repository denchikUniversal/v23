import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieEntity } from './entities/movie.entity';
import { Between, FindOptionsWhere, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { FilterMovieDto } from './dto/filter-movie.dto';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity) 
    private readonly movieRepository: Repository<MovieEntity>
  ) {}

  async findAll(filters: FilterMovieDto) {
    const {
      search,
      yearFrom,
      yearTo,
      isPublic,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = filters;

    // Собираем where через if: в TypeORM 1.x undefined/null в where по умолчанию бросает ошибку
    const where: FindOptionsWhere<MovieEntity> = {};

    if (search) where.title = ILike(`%${search}%`);
    if (isPublic !== undefined) where.isPublic = isPublic;

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
        isPublic: true,
        createdAt: true,
      },
    });

    return { items, meta: this.getMeta(total, page, limit) };
  }

  async create(movie: CreateMovieDto): Promise<MovieEntity> {
    const newMovie = this.movieRepository.create(movie);
    return await this.movieRepository.save(newMovie);
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
