import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ReviewEntity } from "../../review/entities/review.entity";

export enum Genre {
  ACTION = 'Action',
  COMEDY = 'Comedy',
  DRAMA = 'Drama',
  HORROR = 'Horror',
  ROMANCE = 'Romance',
  SCI_FI = 'Sci-Fi',
  THRILLER = 'Thriller',
}

@Entity({
  name: 'movies',
})
export class MovieEntity {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
  })                           
  title: string;

  @Column({
    type: 'text',
    nullable: true,
    default: null
  })                           
  description: string;

  @Column({
    name: 'release_year',
    type: 'int',
    unsigned: true,
  })                           
  releaseYear: number;

  @Column({
    type: 'enum',
    enum: Genre,
    default: Genre.ACTION,
  })
  genre: Genre;

  @Column({
    type: "decimal",
    precision: 3,
    scale: 1,
    default: 0.0,
  })
  rating: number;

  @Column({ 
    name: 'is_available',
    type: 'boolean', 
    default: false 
  })         
  isAvailable: boolean;

  @Column({
    name: 'release_date',
    type: 'date',
    nullable: true,
    default: null
  })
  releaseDate: string;

  @OneToMany(() => ReviewEntity, (review) => review.movie)
  reviews: ReviewEntity[];

  @CreateDateColumn({
    name: 'created_at',
  })                 
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })                 
  updatedAt: Date;
}