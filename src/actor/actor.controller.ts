import { Body, Controller, Post } from '@nestjs/common';
import { ActorService } from './actor.service';
import { CreateActorDTO } from './dto/create-actor.dto';

@Controller('actors')
export class ActorController {
  constructor(
    private readonly actorService: ActorService
  ) {}

  @Post()
  createActor(@Body() dto: CreateActorDTO) {
    return this.actorService.createActor(dto);
  }
}
