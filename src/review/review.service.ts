import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReviewEntity } from './entities/review.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MovieService } from '../movie/movie.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    private readonly movieService: MovieService,
  ) {}

  async createReview(dto: CreateReviewDto): Promise<ReviewEntity> {
    const { movieId, title, text, rating } = dto;

    const movie = await this.movieService.findById(movieId);
    const review = this.reviewRepository.create({ title, text, rating, movie });

    return this.reviewRepository.save(review);
  }

}
