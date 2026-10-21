import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MovieEntity } from "../../movie/entities/movie.entity";

@Entity({
  name: 'reviews',
})
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')  
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })                           
  title: string;

  @Column({
    type: 'text',
  })                           
  text: string;

  @Column({
    type: "decimal",
    precision: 3,
    scale: 1,
    default: 0.0,
  })
  rating: number;

  @Column({
    type: 'uuid',
    name: 'movie_id',
  })
  movieId: string;

  @ManyToOne(() => MovieEntity, (movie) => movie.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: MovieEntity;

  @CreateDateColumn({
    name: 'created_at',
  })                 
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })                 
  updatedAt: Date;
}