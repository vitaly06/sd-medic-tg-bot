import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllFaqs() {
    return this.prisma.faq.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async getFaqByQuestion(question: string) {
    return this.prisma.faq.findFirst({
      where: { question },
    });
  }

  async createFaq(question: string, answer: string) {
    return this.prisma.faq.create({
      data: { question, answer },
    });
  }

  async updateFaq(id: number, data: { question?: string; answer?: string }) {
    return this.prisma.faq.update({
      where: { id },
      data,
    });
  }

  async deleteFaq(id: number) {
    return this.prisma.faq.delete({
      where: { id },
    });
  }

  getFaqQuestions(faqs: any[]) {
    return faqs.map((faq) => faq.question);
  }

  formatFaqList(faqs: any[]) {
    let message = '📋 Список FAQ:\n\n';
    faqs.forEach((faq, index) => {
      message += `${index + 1}. Вопрос: ${faq.question}\n   Ответ: ${faq.answer}\n\n`;
    });
    return message;
  }

  formatFaqNumberList(faqs: any[]) {
    let message = '';
    faqs.forEach((faq, index) => {
      message += `${index + 1}. ${faq.question}\n`;
    });
    return message;
  }
}
