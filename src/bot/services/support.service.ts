import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(userId: number, subject?: string) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        status: 'open',
      },
    });
  }

  async getActiveTicketByUserId(userId: number) {
    return this.prisma.supportTicket.findFirst({
      where: {
        userId,
        status: {
          in: ['open', 'in_progress'],
        },
      },
      include: {
        messages: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: true,
      },
    });
  }

  async getAllOpenTickets() {
    return this.prisma.supportTicket.findMany({
      where: {
        status: {
          in: ['open', 'in_progress'],
        },
      },
      include: {
        user: true,
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getTicketById(ticketId: number) {
    return this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          include: {
            user: {
              include: {
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: true,
      },
    });
  }

  async addMessage(
    ticketId: number,
    userId: number,
    message: string,
    photos: string[] = [],
  ) {
    return this.prisma.supportMessage.create({
      data: {
        ticketId,
        userId,
        message,
        photos,
      },
    });
  }

  async updateTicketStatus(
    ticketId: number,
    status: 'open' | 'in_progress' | 'closed',
  ) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        closedAt: status === 'closed' ? new Date() : null,
      },
    });
  }

  async closeTicket(ticketId: number) {
    return this.updateTicketStatus(ticketId, 'closed');
  }

  formatTicketsList(tickets: any[]) {
    if (tickets.length === 0) {
      return 'Нет открытых обращений';
    }

    return tickets
      .map((ticket, index) => {
        const lastMessage =
          ticket.messages.length > 0
            ? ticket.messages[0].message.substring(0, 50) + '...'
            : 'Нет сообщений';
        const statusEmoji =
          ticket.status === 'open'
            ? '🆕'
            : ticket.status === 'in_progress'
              ? '💬'
              : '✅';
        return `${index + 1}. ${statusEmoji} ID: ${ticket.id}\nПользователь: @${ticket.user.username || ticket.user.firstName}\n${lastMessage}`;
      })
      .join('\n\n');
  }

  formatMessages(messages: any[]) {
    return messages
      .map((msg) => {
        const role = msg.user.role?.name || 'user';
        const prefix = role === 'user' ? '👤 Пользователь' : '👨‍💼 Поддержка';
        const time = new Date(msg.createdAt).toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${prefix} (${time}):\n${msg.message}`;
      })
      .join('\n\n');
  }

  async getSupportUsers() {
    return this.prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['admin', 'support'],
          },
        },
      },
    });
  }
}
