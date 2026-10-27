import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ReviewEntity } from "../../review/entities/review.entity";
import { ActorEntity } from "../../actor/entities/actor.entity";

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

  @ManyToMany(() => ActorEntity, (actor) => actor.movies)
  @JoinTable({
    name: "movie_actors",
    joinColumn: { name: "movie_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "actor_id", referencedColumnName: "id" }
  })
  actors: ActorEntity[];

  @CreateDateColumn({
    name: 'created_at',
  })                 
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })                 
  updatedAt: Date;
}