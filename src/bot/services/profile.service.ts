import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateProfile(
    userId: number,
    data: {
      mseDate?: Date;
      firstTsrDate?: Date;
      tsrMethod?: string;
      tsrTypes?: string;
      nextTsrDate?: Date;
      tsrPeriodMonths?: number;
      reminderDaysBefore?: number;
      additionalData?: string;
    },
  ) {
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    // Автоматический расчет nextTsrDate если не указана явно
    let calculatedData = { ...data };

    if (data.firstTsrDate && !data.nextTsrDate) {
      const periodMonths =
        data.tsrPeriodMonths || existingProfile?.tsrPeriodMonths || 3;
      calculatedData.nextTsrDate = this.calculateNextTsrDate(
        data.firstTsrDate,
        periodMonths,
      );
    }

    if (existingProfile) {
      // Если обновляется firstTsrDate или период, пересчитываем nextTsrDate
      if ((data.firstTsrDate || data.tsrPeriodMonths) && !data.nextTsrDate) {
        const baseDate = data.firstTsrDate || existingProfile.firstTsrDate;
        const periodMonths =
          data.tsrPeriodMonths || existingProfile.tsrPeriodMonths;

        if (baseDate) {
          calculatedData.nextTsrDate = this.calculateNextTsrDate(
            new Date(baseDate),
            periodMonths,
          );
        }
      }

      return this.prisma.userProfile.update({
        where: { userId },
        data: calculatedData,
      });
    }

    return this.prisma.userProfile.create({
      data: {
        userId,
        ...calculatedData,
      },
    });
  }

  // Расчет следующей даты получения ТСР
  private calculateNextTsrDate(firstDate: Date, periodMonths: number): Date {
    const now = new Date();
    const startDate = new Date(firstDate);

    // Находим ближайшую будущую дату
    let nextDate = new Date(startDate);

    while (nextDate <= now) {
      nextDate.setMonth(nextDate.getMonth() + periodMonths);
    }

    return nextDate;
  }

  async getProfile(userId: number) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  async getUsersForTsrReminders(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.userProfile.findMany({
      where: {
        nextTsrDate: {
          gte: today,
          lte: futureDate,
        },
        notificationsEnabled: true,
      },
      include: {
        user: true,
      },
    });
  }

  async getUsersForTodayReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.userProfile.findMany({
      where: {
        nextTsrDate: {
          gte: today,
          lt: tomorrow,
        },
        notificationsEnabled: true,
      },
      include: {
        user: true,
      },
    });
  }

  // Получить пользователей для предварительных напоминаний (за N дней до срока)
  async getUsersForAdvanceReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const profiles = await this.prisma.userProfile.findMany({
      where: {
        nextTsrDate: {
          gte: today,
        },
        notificationsEnabled: true,
      },
      include: {
        user: true,
      },
    });

    // Фильтруем тех, кому нужно отправить напоминание
    return profiles.filter((profile) => {
      if (!profile.nextTsrDate) return false;

      const daysUntil = Math.ceil(
        (new Date(profile.nextTsrDate).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Проверяем, пора ли отправлять напоминание
      const shouldRemind = daysUntil === profile.reminderDaysBefore;

      // Проверяем, не отправляли ли уже сегодня
      if (profile.lastReminderSent) {
        const lastSent = new Date(profile.lastReminderSent);
        lastSent.setHours(0, 0, 0, 0);
        if (lastSent.getTime() === today.getTime()) {
          return false; // Уже отправляли сегодня
        }
      }

      return shouldRemind;
    });
  }

  // Отметить что напоминание отправлено
  async markReminderSent(userId: number) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        lastReminderSent: new Date(),
      },
    });
  }

  // Обновить период получения ТСР и пересчитать nextTsrDate
  async updateTsrPeriod(userId: number, periodMonths: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile || !profile.firstTsrDate) {
      throw new Error('Профиль или дата первого получения ТСР не найдены');
    }

    const nextTsrDate = this.calculateNextTsrDate(
      new Date(profile.firstTsrDate),
      periodMonths,
    );

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        tsrPeriodMonths: periodMonths,
        nextTsrDate,
      },
    });
  }

  // Продлить ТСР - установить следующую дату на N месяцев вперед
  async extendTsr(userId: number) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Профиль не найден');
    }

    const baseDate = profile.nextTsrDate || new Date();
    const nextDate = new Date(baseDate);
    nextDate.setMonth(nextDate.getMonth() + profile.tsrPeriodMonths);

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        nextTsrDate: nextDate,
      },
    });
  }

  async toggleNotifications(userId: number, enabled: boolean) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        notificationsEnabled: enabled,
      },
    });
  }

  formatProfile(profile: any) {
    if (!profile) {
      return 'Профиль не заполнен';
    }

    let text = '📋 Ваш профиль:\n\n';

    if (profile.mseDate) {
      text += `📅 Дата МСЭ по ИПРа: ${new Date(profile.mseDate).toLocaleDateString('ru-RU')}\n`;
    }

    if (profile.firstTsrDate) {
      text += `📅 Дата первого получения ТСР: ${new Date(profile.firstTsrDate).toLocaleDateString('ru-RU')}\n`;
    }

    if (profile.tsrMethod) {
      text += `💳 Способ получения ТСР: ${profile.tsrMethod}\n`;
    }

    if (profile.tsrTypes) {
      text += `📝 Виды ТСР: ${profile.tsrTypes}\n`;
    }

    text += `\n⏱ Периодичность получения: каждые ${profile.tsrPeriodMonths || 3} месяца\n`;

    if (profile.nextTsrDate) {
      const nextDate = new Date(profile.nextTsrDate);
      const today = new Date();
      const daysUntil = Math.ceil(
        (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      text += `⏰ Следующее получение ТСР: ${nextDate.toLocaleDateString('ru-RU')}`;

      if (daysUntil > 0) {
        text += ` (через ${daysUntil} дн.)`;
      } else if (daysUntil === 0) {
        text += ` (сегодня!)`;
      } else {
        text += ` (просрочено на ${Math.abs(daysUntil)} дн.)`;
      }
      text += '\n';
    }

    text += `🔔 Напоминание за: ${profile.reminderDaysBefore || 21} дней\n`;
    text += `🔔 Уведомления: ${profile.notificationsEnabled ? 'Включены ✅' : 'Выключены ❌'}`;

    return text;
  }
}
