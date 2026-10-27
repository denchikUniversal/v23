import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActorEntity } from './entities/actor.entity';
import { Repository } from 'typeorm';
import { CreateActorDTO } from './dto/create-actor.dto';

@Injectable()
export class ActorService {
  constructor(@InjectRepository(ActorEntity) private readonly actorRepository: Repository<ActorEntity>) {}

  async createActor(dto: CreateActorDTO) {
    const { name } = dto;

    const actor: ActorEntity = this.actorRepository.create({ name });

    return await this.actorRepository.save(actor);
  }
}
