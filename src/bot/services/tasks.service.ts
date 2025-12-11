import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProfileService } from './profile.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly profileService: ProfileService,
    @InjectBot() private readonly bot: Telegraf,
  ) {}

  // Запускается каждый день в 10:00 по московскому времени
  @Cron('0 10 * * *', {
    timeZone: 'Europe/Moscow',
  })
  async handleTsrReminders() {
    this.logger.log('Запуск проверки напоминаний о ТСР');

    try {
      // 1. ПРЕДВАРИТЕЛЬНЫЕ НАПОМИНАНИЯ (за N дней, обычно 21 день = 3 недели)
      const usersForAdvanceReminder =
        await this.profileService.getUsersForAdvanceReminders();

      this.logger.log(
        `Найдено ${usersForAdvanceReminder.length} пользователей для предварительных напоминаний`,
      );

      for (const userProfile of usersForAdvanceReminder) {
        const user = userProfile.user;
        const daysUntil = Math.ceil(
          (new Date(userProfile.nextTsrDate!).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );

        let message = '⏰ Напоминание о подаче документов на ТСР\n\n';
        message += `📅 Через ${daysUntil} дней (${new Date(userProfile.nextTsrDate!).toLocaleDateString('ru-RU')}) истекает срок получения ТСР!\n\n`;

        if (userProfile.tsrMethod === 'сертификат') {
          message +=
            '💳 Для получения по электронному сертификату рекомендуем подать заявку через Госуслуги заранее (обычно за 3 недели до срока).\n\n';
        }

        if (userProfile.tsrTypes) {
          message += `📋 Виды ТСР: ${userProfile.tsrTypes}\n\n`;
        }

        message += `⏱ Периодичность получения: каждые ${userProfile.tsrPeriodMonths} мес.\n`;
        message +=
          '\n📝 Подготовьте необходимые документы и подайте заявку на продление через Госуслуги.';

        try {
          await this.bot.telegram.sendMessage(user.tgId, message);
          await this.profileService.markReminderSent(user.id);
          this.logger.log(
            `Отправлено предварительное напоминание пользователю ${user.tgId} (${user.firstName}), дней до срока: ${daysUntil}`,
          );
        } catch (error) {
          this.logger.error(
            `Ошибка отправки предварительного напоминания пользователю ${user.tgId}: ${error.message}`,
          );
        }
      }

      // 2. НАПОМИНАНИЯ В ДЕНЬ ПОЛУЧЕНИЯ
      const usersToday = await this.profileService.getUsersForTodayReminders();

      this.logger.log(
        `Найдено ${usersToday.length} пользователей для напоминаний сегодня`,
      );

      for (const userProfile of usersToday) {
        const user = userProfile.user;

        let message = '🔔 Напоминание о получении ТСР\n\n';
        message += '📅 Сегодня - крайний день получения ТСР!\n\n';

        if (userProfile.tsrTypes) {
          message += `📋 Виды ТСР: ${userProfile.tsrTypes}\n`;
        }

        if (userProfile.tsrMethod) {
          message += `📝 Способ получения: ${userProfile.tsrMethod}\n\n`;
        }

        if (userProfile.tsrMethod === 'сертификат') {
          message +=
            'Если вы еще не подали документы через Госуслуги, сделайте это как можно скорее!\n\n';
        }

        message +=
          'Не забудьте своевременно получить назначенные технические средства реабилитации.';

        try {
          await this.bot.telegram.sendMessage(user.tgId, message);
          this.logger.log(
            `Отправлено напоминание в день получения пользователю ${user.tgId} (${user.firstName})`,
          );
        } catch (error) {
          this.logger.error(
            `Ошибка отправки напоминания пользователю ${user.tgId}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при обработке напоминаний о ТСР: ${error.message}`,
      );
    }
  }

  // Для тестирования - запускается каждую минуту (закомментировано)
  // @Cron(CronExpression.EVERY_MINUTE)
  // async testTsrReminders() {
  //   this.logger.log('Тестовая проверка напоминаний о ТСР');
  //   await this.handleTsrReminders();
  // }
}
