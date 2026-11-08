import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async sendMessage(dto: SendMessageDto) {
    const { text } = dto;

    const message = await this.prisma.message.create({
      data: {
        text,
      },
    });

    return message;
  }
}
