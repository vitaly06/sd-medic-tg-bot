import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTgId(tgId: string) {
    return await this.prisma.user.findUnique({
      where: { tgId },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  formatUserNumberList(users: any[]) {
    let message = '';
    users.forEach((user, index) => {
      message += `${index + 1}. ${user.username}\n`;
    });
    return message;
  }
}
