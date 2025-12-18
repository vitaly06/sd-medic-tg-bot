import { Injectable, NotFoundException } from '@nestjs/common';
import { Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { join } from 'path';
import { Context, Input, Markup } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { FaqService } from './services/faq.service';
import { AdminService } from './services/admin.service';
import { StateService } from './services/state.service';
import { SupportService } from './services/support.service';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { ProfileService } from './services/profile.service';

const MAIN_KEYBOARD = Markup.keyboard([
  ['📚 Каталог', '🛒 Корзина'],
  ['Поддержка', '💬 Живой чат'],
  ['👤 Профиль'],
]).resize();
const ADMIN_KEYBOARD = Markup.keyboard([
  ['Настройка поддержки', 'Управление пользователями'],
  ['Товары', 'Рассылка'],
  ['💬 Обращения', '📄 Экспорт базы'],
]).resize();
const SUPPORT_KEYBOARD = Markup.keyboard([
  'Настройка поддержки',
  '💬 Обращения',
]).resize();

@Update()
@Injectable()
export class BotService {
  agree = '✅ Да, согласен';
  disagree = '❌ Нет, не согласен';

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly faqService: FaqService,
    private readonly adminService: AdminService,
    private readonly stateService: StateService,
    private readonly supportService: SupportService,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly profileService: ProfileService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const checkUser = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from?.id) },
      include: {
        role: true,
      },
    });

    if (checkUser) {
      // Проверка блокировки пользователя
      if (checkUser.isBlocked) {
        const reason = checkUser.blockedReason
          ? `\n\nПричина: ${checkUser.blockedReason}`
          : '';
        await ctx.reply(
          `🚫 Ваш аккуратный заблокирован.${reason}\n\nДля разблокировки обратитесь в службу поддержки.`,
        );
        return;
      }

      if (checkUser.role.name == 'admin') {
        await ctx.reply('Добро пожаловать, Администратор!', ADMIN_KEYBOARD);
        return;
      }
      if (checkUser.role.name == 'support') {
        await ctx.reply('Добро пожаловать, Поддержка!', SUPPORT_KEYBOARD);
        return;
      }
      await ctx.reply('Добро пожаловать!', MAIN_KEYBOARD);
      return;
    }

    await ctx.reply(
      'Добро пожаловать в бота!\nЗапуская бота, вы выражаете своё согласие на обработку персональных данных',
    );
    await ctx.replyWithDocument(
      Input.fromLocalFile(
        join(__dirname, '..', '..', '..', 'docs', 'personal-soglasie.pdf'),
      ),
    );

    await ctx.reply(
      'Согласны ли вы на обработку персональных данных?',
      Markup.keyboard([[this.agree], [this.disagree]])
        .oneTime()
        .resize(),
    );
  }

  // Администратор
  // Вопросы
  @Hears('Настройка поддержки')
  async editSupport(@Ctx() ctx: Context) {
    await this.adminService.showFaqManagement(ctx);
  }

  @Hears('➕ Добавить вопрос')
  async addFaqStart(@Ctx() ctx: Context) {
    await this.adminService.startAddFaq(ctx);
  }

  @Hears('✏️ Редактировать вопрос')
  async editFaqStart(@Ctx() ctx: Context) {
    await this.adminService.startEditFaq(ctx);
  }

  @Hears('🗑 Удалить вопрос')
  async deleteFaqStart(@Ctx() ctx: Context) {
    await this.adminService.startDeleteFaq(ctx);
  }

  @Hears('◀️ Назад')
  async backButton(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    this.stateService.deleteState(ctx.from.id);

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
      include: { role: true },
    });

    if (user?.role.name === 'admin') {
      await ctx.reply('Главное меню', ADMIN_KEYBOARD);
    } else if (user?.role.name === 'support') {
      await ctx.reply('Главное меню', SUPPORT_KEYBOARD);
    } else {
      await ctx.reply('Главное меню', MAIN_KEYBOARD);
    }
  }
  // Пользователи
  @Hears('Управление пользователями')
  async manageUsers(@Ctx() ctx: Context) {
    await this.adminService.manageUsers(ctx);
  }

  @Hears('➕ Добавить сотрудника')
  async addUserStart(@Ctx() ctx: Context) {
    await this.adminService.startAddUser(ctx);
  }

  @Hears('✏️ Редактировать сотрудника')
  async editUserStart(@Ctx() ctx: Context) {
    await this.adminService.startEditUser(ctx);
  }

  @Hears('🗑 Удалить сотрудника')
  async deleteUserStart(@Ctx() ctx: Context) {
    await this.adminService.startDeleteUser(ctx);
  }

  @Hears('🔍 Найти пользователя')
  async searchUserStart(@Ctx() ctx: Context) {
    await this.adminService.searchUsers(ctx);
  }

  @Hears('🔗 Пригласительная ссылка')
  async generateInvite(@Ctx() ctx: Context) {
    await this.adminService.generateInviteLink(ctx);
  }

  @Hears('🚫 Заблокировать')
  async blockUserAction(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    if (state?.action === 'user_action_menu' && state.data?.user) {
      this.stateService.setState(ctx.from.id, {
        action: 'block_user_reason',
        data: state.data,
      });
      await ctx.reply(
        'Введите причину блокировки или напишите "пропустить":',
        Markup.removeKeyboard(),
      );
    }
  }

  @Hears('✅ Разблокировать')
  async unblockUserAction(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    if (state?.action === 'user_action_menu' && state.data?.user) {
      await this.adminService.unblockUser(ctx, state.data.user.id);
    }
  }

  @Hears('👤 Изменить роль')
  async changeUserRoleAction(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    if (state?.action === 'user_action_menu' && state.data?.user) {
      this.stateService.setState(ctx.from.id, {
        action: 'change_user_role',
        data: state.data,
      });
      await ctx.reply(
        `Выберите новую роль для пользователя:`,
        Markup.keyboard(['admin', 'support', 'user', '◀️ Назад'])
          .oneTime()
          .resize(),
      );
    }
  }

  @Hears('� Редактировать профиль')
  async editUserProfileAction(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    // Если это админ редактирует профиль пользователя
    if (state?.action === 'user_action_menu' && state.data?.user) {
      const targetUser = state.data.user;
      const profile = await this.profileService.getProfile(targetUser.id);
      const profileText = profile
        ? this.profileService.formatProfile(profile)
        : '❌ Профиль не заполнен';

      this.stateService.setState(ctx.from.id, {
        action: 'admin_edit_user_profile',
        data: { user: targetUser },
      });

      const keyboard = Markup.keyboard([
        ['📅 Дата МСЭ', '📅 Дата первого ТСР'],
        ['📅 След. получение ТСР'],
        ['📋 Способ получения', '📋 Виды ТСР'],
        ['⏱ Периодичность ТСР', '⏰ Срок напоминания'],
        ['◀️ Назад'],
      ]).resize();

      await ctx.reply(
        `Редактирование профиля пользователя @${targetUser.username || targetUser.firstName}\n\n${profileText}\n\n✏️ Выберите поле для редактирования:`,
        keyboard,
      );
      return;
    }
  }

  @Hears('�🗑 Удалить пользователя')
  async deleteUserAction(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    if (state?.action === 'user_action_menu' && state.data?.user) {
      this.stateService.setState(ctx.from.id, {
        action: 'confirm_delete_user',
        data: state.data,
      });
      await ctx.reply(
        `⚠️ ВНИМАНИЕ!\n\nВы действительно хотите удалить пользователя?\nЭто действие необратимо!`,
        Markup.keyboard(['✅ Да, удалить', '❌ Отмена']).oneTime().resize(),
      );
    }
  }

  @Hears('✅ Да, удалить')
  async confirmDeleteUser(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    if (state?.action === 'confirm_delete_user' && state.data?.user) {
      await this.adminService.deleteUser(ctx, state.data.user.id);
    }
  }

  @Hears('👤 Профиль')
  async onProfileButton(@Ctx() ctx: Context) {
    await this.onProfile(ctx);
  }

  // Товары
  @Hears('Товары')
  async manageProducts(@Ctx() ctx: Context) {
    await this.adminService.manageProducts(ctx);
  }

  @Hears('➕ Добавить товар')
  async addProductStart(@Ctx() ctx: Context) {
    await this.adminService.startAddProduct(ctx);
  }

  @Hears('✏️ Редактировать товар')
  async editProductStart(@Ctx() ctx: Context) {
    await this.adminService.startEditProduct(ctx);
  }

  @Hears('🗑 Удалить товар')
  async deleteProductStart(@Ctx() ctx: Context) {
    await this.adminService.startDeleteProduct(ctx);
  }

  // Рассылка
  @Hears('Рассылка')
  async broadcastStart(@Ctx() ctx: Context) {
    await this.adminService.startBroadcast(ctx);
  }

  // Экспорт базы
  @Hears('📄 Экспорт базы')
  async exportDatabase(@Ctx() ctx: Context) {
    await ctx.reply('📊 Начинаю экспорт базы данных...');
    await this.adminService.exportUsersToExcel(ctx);
  }

  @Hears('Поддержка')
  async onSupport(@Ctx() ctx: Context) {
    const faqs = await this.faqService.getAllFaqs();

    if (faqs.length === 0) {
      await ctx.reply('Вопросов пока нет', MAIN_KEYBOARD);
      return;
    }

    const questions = this.faqService.getFaqQuestions(faqs);
    const keyboard: string[][] = [];
    for (let i = 0; i < questions.length; i += 2) {
      keyboard.push(questions.slice(i, i + 2));
    }
    keyboard.push(['💬 Живой чат'], ['◀️ Назад']);

    await ctx.reply(
      'Часто-задаваемые вопросы',
      Markup.keyboard(keyboard).resize(),
    );
  }

  @Hears('💬 Живой чат')
  async onLiveChat(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) {
      await ctx.reply('Пожалуйста, сначала запустите бота /start');
      return;
    }

    // Проверяем, есть ли активное обращение
    const activeTicket = await this.supportService.getActiveTicketByUserId(
      user.id,
    );

    if (activeTicket) {
      // Отмечаем сообщения как прочитанные пользователем
      await this.supportService.markAsReadByUser(activeTicket.id);

      const unreadIndicator = activeTicket.hasUnreadAdminMessages ? '🔴 ' : '';
      await ctx.reply(
        `${unreadIndicator}У вас уже есть активное обращение в поддержку.\n\nОтправьте сообщение, и оно будет передано в службу поддержки.`,
        Markup.keyboard([['◀️ Назад']]).resize(),
      );
      return;
    }

    // Создаем новое обращение
    await this.supportService.createTicket(user.id);
    await ctx.reply(
      '💬 Вы создали обращение в службу поддержки.\n\n⏰ Режим работы техподдержки: 9:00 - 18:00 (МСК)\nВ нерабочее время ответ может быть отправлен с задержкой.\n\nОтправьте ваше сообщение или фото, и наши специалисты свяжутся с вами в ближайшее время.',
      Markup.keyboard([['◀️ Назад']]).resize(),
    );

    // Уведомляем службу поддержки о новом обращении
    await this.notifySupportNewTicket(ctx, user);
  }

  @Hears('💬 Обращения')
  async onSupportTickets(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
      include: { role: true },
    });

    if (!user || (user.role.name !== 'admin' && user.role.name !== 'support')) {
      return;
    }

    const tickets = await this.supportService.getAllOpenTickets();
    const message = this.supportService.formatTicketsList(tickets);

    const keyboard =
      user.role.name === 'admin' ? ADMIN_KEYBOARD : SUPPORT_KEYBOARD;

    await ctx.reply(
      `📋 Открытые обращения:\n\n${message}\n\nДля просмотра обращения отправьте ID обращения.`,
      keyboard,
    );
  }

  @Hears('📚 Каталог')
  async onCatalog(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const products = await this.productService.getAllProducts();

    if (products.length === 0) {
      await ctx.reply('Каталог пока пуст', MAIN_KEYBOARD);
      return;
    }

    await ctx.reply('📚 Каталог товаров:', Markup.removeKeyboard());

    for (const product of products) {
      const caption = `${product.name}\n\n💰 Цена: ${product.price} руб.\n\n📝 ${product.description}${product.link ? `\n\n🔗 ${product.link}` : ''}\n\nДля добавления в корзину отправьте:\n/add${product.id} количество\n\nНапример: /add${product.id} 2`;

      if (product.images && product.images.length > 0) {
        await ctx.replyWithPhoto(product.images[0], { caption });
      } else {
        await ctx.reply(caption);
      }
    }

    await ctx.reply(
      'Для просмотра корзины нажмите кнопку "🛒 Корзина"',
      MAIN_KEYBOARD,
    );
  }

  @Hears('/profile')
  async onProfile(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) {
      await ctx.reply('Пожалуйста, сначала запустите бота /start');
      return;
    }

    const profile = await this.profileService.getProfile(user.id);
    const message = profile
      ? this.profileService.formatProfile(profile)
      : '❌ Профиль не заполнен. Пожалуйста, заполните анкету при регистрации.';

    const keyboard = Markup.keyboard([
      ['✏️ Редактировать профиль'],
      [
        '🔔 Уведомления ТСР: ' +
          (profile?.notificationsEnabled ? 'Вкл' : 'Выкл'),
      ],
      ['◀️ Назад'],
    ]).resize();

    await ctx.reply(message, keyboard);
  }

  @Hears('✏️ Редактировать профиль')
  async onEditProfile(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) {
      await ctx.reply('Пожалуйста, сначала запустите бота /start');
      return;
    }

    const keyboard = Markup.keyboard([
      ['📅 Дата МСЭ', '📅 Дата первого ТСР'],
      ['📅 След. получение ТСР'],
      ['📋 Способ получения', '📋 Виды ТСР'],
      ['⏱ Периодичность ТСР', '⏰ Срок напоминания'],
      ['◀️ Назад'],
    ]).resize();

    await ctx.reply('✏️ Выберите поле для редактирования:', keyboard);
  }

  @Hears('⏱ Периодичность ТСР')
  async onEditTsrPeriod(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_tsr_period',
      data: targetUser ? { targetUser } : undefined,
    });
    await ctx.reply(
      '⏱ Укажите периодичность получения ТСР в месяцах:\n\n' +
        '• 3 - каждые 3 месяца (по умолчанию)\n' +
        '• 6 - каждые 6 месяцев\n' +
        '• 12 - каждый год\n\n' +
        'Введите число месяцев или "пропустить" для отмены:',
    );
  }

  @Hears('⏰ Срок напоминания')
  async onEditReminderDays(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_reminder_days',
      data: targetUser ? { targetUser } : undefined,
    });
    await ctx.reply(
      '⏰ За сколько дней до срока напоминать?\n\n' +
        '• 21 - за 3 недели (по умолчанию, рекомендуется для эл. сертификата)\n' +
        '• 14 - за 2 недели\n' +
        '• 7 - за неделю\n' +
        '• 3 - за 3 дня\n\n' +
        'Введите количество дней или "пропустить" для отмены:',
    );
  }

  @Hears('📅 Дата МСЭ')
  async onEditMseDate(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    // Сохраняем информацию о редактируемом пользователе, если это админ
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_mse_date',
      data: targetUser ? { targetUser } : undefined,
    });
    await ctx.reply(
      '📅 Введите новую дату заключения МСЭ по ИПРа (формат: ДД.ММ.ГГГГ)\nИли напишите "пропустить" чтобы очистить:',
    );
  }

  @Hears('📅 Дата первого ТСР')
  async onEditFirstTsrDate(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_first_tsr_date',
      data: targetUser ? { targetUser } : undefined,
    });
    await ctx.reply(
      '📅 Введите новую дату первого получения ТСР (формат: ДД.ММ.ГГГГ)\nИли напишите "пропустить" чтобы очистить:',
    );
  }

  @Hears('📅 След. получение ТСР')
  async onEditNextTsrDate(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_next_tsr_date',
      data: targetUser ? { targetUser } : undefined,
    });
    await ctx.reply(
      '📅 Введите новую дату следующего получения ТСР (формат: ДД.ММ.ГГГГ)\nИли напишите "пропустить" чтобы очистить:',
    );
  }

  @Hears('📋 Способ получения')
  async onEditTsrMethod(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_tsr_method',
      data: targetUser ? { targetUser } : undefined,
    });
    const keyboard = Markup.keyboard([
      ['выдача', 'сертификат'],
      ['пропустить'],
    ]).resize();
    await ctx.reply(
      '📋 Выберите способ получения ТСР (выдача/сертификат)\nИли напишите "пропустить" чтобы очистить:',
      keyboard,
    );
  }

  @Hears('📋 Виды ТСР')
  async onEditTsrTypes(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    const targetUser =
      state?.action === 'admin_edit_user_profile' ? state.data.user : null;

    this.stateService.setState(ctx.from.id, {
      action: 'edit_profile_tsr_types',
      data: targetUser ? { targetUser } : undefined,
    });
    await ctx.reply(
      '📋 Введите новые виды назначенных ТСР (через запятую)\nНапример: коляска, протезы, ортопедическая обувь\nИли напишите "пропустить" чтобы очистить:',
    );
  }

  @Hears(/^🔔 Уведомления ТСР:/)
  async onToggleNotifications(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) return;

    const currentProfile = await this.profileService.getProfile(user.id);
    const currentEnabled = currentProfile?.notificationsEnabled ?? true;

    const profile = await this.profileService.toggleNotifications(
      user.id,
      !currentEnabled,
    );
    const status = profile.notificationsEnabled
      ? '✅ включены'
      : '❌ выключены';

    await ctx.reply(
      `🔔 Уведомления о получении ТСР ${status}`,
      Markup.keyboard([
        ['✏️ Редактировать профиль'],
        [
          '🔔 Уведомления ТСР: ' +
            (profile.notificationsEnabled ? 'Вкл' : 'Выкл'),
        ],
        ['◀️ Назад'],
      ]).resize(),
    );
  }

  @Hears('🛒 Корзина')
  async onCart(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) {
      await ctx.reply('Пожалуйста, сначала запустите бота /start');
      return;
    }

    const cartItems = await this.cartService.getCart(user.id);
    const message = this.cartService.formatCart(cartItems);

    if (cartItems.length === 0) {
      await ctx.reply(message, MAIN_KEYBOARD);
      return;
    }

    const keyboard = Markup.keyboard([
      ['✅ Оформить заказ'],
      ['🗑 Очистить корзину'],
      ['◀️ Назад'],
    ]).resize();

    await ctx.reply(message, keyboard);
    await ctx.reply(
      'Для изменения количества используйте:\n/set ID количество\n\nДля удаления товара:\n/remove ID\n\nНапример: /set 1 3',
    );
  }

  @Hears('✅ Оформить заказ')
  async onCheckout(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) return;

    const cartItems = await this.cartService.getCart(user.id);

    if (cartItems.length === 0) {
      await ctx.reply('Ваша корзина пуста', MAIN_KEYBOARD);
      return;
    }

    this.stateService.setState(ctx.from.id, {
      action: 'checkout_contact',
    });

    await ctx.reply(
      'Оформление заказа\n\nШаг 1/3: Укажите ваш контактный телефон или email:',
      Markup.removeKeyboard(),
    );
  }

  @Hears('🗑 Очистить корзину')
  async onClearCart(@Ctx() ctx: Context) {
    if (!ctx.from) return;

    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (!user) return;

    await this.cartService.clearCart(user.id);
    await ctx.reply('🛒 Корзина очищена', MAIN_KEYBOARD);
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    if (state?.action === 'add_product_images') {
      await this.adminService.handleAddProductImages(ctx, state.data);
      return;
    }

    if (state?.action === 'edit_product_images') {
      await this.adminService.handleEditProductImages(ctx, state.data);
      return;
    }

    if (state?.action === 'broadcast_message') {
      await this.adminService.handleBroadcastPhoto(ctx, state.data);
      return;
    }

    // Обработка фото в чате поддержки
    const user = await this.prisma.user.findUnique({
      where: { tgId: String(ctx.from.id) },
    });

    if (user) {
      const activeTicket = await this.supportService.getActiveTicketByUserId(
        user.id,
      );

      if (activeTicket && ctx.message && 'photo' in ctx.message) {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const caption =
          'caption' in ctx.message ? ctx.message.caption || 'Фото' : 'Фото';

        await this.supportService.addMessage(
          activeTicket.id,
          user.id,
          caption,
          [photo.file_id],
        );
        await ctx.reply('✅ Ваше фото отправлено в службу поддержки.');

        // Уведомляем службу поддержки
        const supportUsers = await this.supportService.getSupportUsers();
        for (const supportUser of supportUsers) {
          try {
            await ctx.telegram.sendPhoto(supportUser.tgId, photo.file_id, {
              caption: `💬 Новое фото в обращении #${activeTicket.id}\n\nПользователь: @${user.username || user.firstName}\n\n${caption}`,
            });
          } catch (error) {
            console.error(
              `Failed to notify support user ${supportUser.tgId}:`,
              error,
            );
          }
        }
      }
    }
  }

  @On('text')
  async onButtonPress(@Ctx() ctx: Context) {
    if (ctx.message && 'text' in ctx.message && ctx.from) {
      const state = this.stateService.getState(ctx.from.id);

      // === ГЛОБАЛЬНАЯ ПРОВЕРКА БЛОКИРОВКИ ===

      const currentUser = await this.prisma.user.findUnique({
        where: { tgId: String(ctx.from.id) },
        include: { role: true },
      });

      if (currentUser?.isBlocked) {
        const reason = currentUser.blockedReason
          ? `\n\nПричина: ${currentUser.blockedReason}`
          : '';
        await ctx.reply(
          `🚫 Ваш аккуратный заблокирован.${reason}\n\nДля разблокировки обратитесь в службу поддержки.`,
        );
        return;
      }

      // === ОБРАБОТКА ПРОСМОТРА ОБРАЩЕНИЙ (для поддержки) ===

      const user = currentUser;

      if (
        user &&
        (user.role.name === 'admin' || user.role.name === 'support') &&
        !state // Только если нет активного состояния
      ) {
        const ticketId = parseInt(ctx.message.text);
        if (!isNaN(ticketId)) {
          const ticket = await this.supportService.getTicketById(ticketId);
          if (ticket) {
            // Отмечаем сообщения как прочитанные админом
            await this.supportService.markAsReadByAdmin(ticketId);

            const messages = this.supportService.formatMessages(
              ticket.messages,
            );
            const keyboard =
              user.role.name === 'admin' ? ADMIN_KEYBOARD : SUPPORT_KEYBOARD;

            await ctx.reply(
              `📋 Обращение #${ticket.id}\nСтатус: ${ticket.status}\nПользователь: @${ticket.user.username || ticket.user.firstName}\n\n${messages}\n\nДля ответа отправьте: /reply ${ticket.id} текст ответа`,
              keyboard,
            );
            return;
          }
        }

        // Обработка команды ответа на обращение
        if (ctx.message.text.startsWith('/reply ')) {
          const parts = ctx.message.text.split(' ');
          const ticketIdStr = parts[1];
          const replyText = parts.slice(2).join(' ');

          if (ticketIdStr && replyText) {
            const ticketId = parseInt(ticketIdStr);
            const ticket = await this.supportService.getTicketById(ticketId);

            if (ticket) {
              await this.supportService.addMessage(
                ticketId,
                user.id,
                replyText,
              );
              await this.supportService.updateTicketStatus(
                ticketId,
                'in_progress',
              );

              // Уведомляем пользователя
              await ctx.telegram.sendMessage(
                ticket.user.tgId,
                `💬 Ответ от службы поддержки по обращению #${ticketId}:\n\n${replyText}`,
              );

              const keyboard =
                user.role.name === 'admin' ? ADMIN_KEYBOARD : SUPPORT_KEYBOARD;
              await ctx.reply('✅ Ответ отправлен пользователю', keyboard);
              return;
            }
          }
        }

        // Обработка команды закрытия обращения
        if (ctx.message.text.startsWith('/close ')) {
          const ticketIdStr = ctx.message.text.split(' ')[1];
          if (ticketIdStr) {
            const ticketId = parseInt(ticketIdStr);
            const ticket = await this.supportService.getTicketById(ticketId);

            if (ticket) {
              await this.supportService.closeTicket(ticketId);

              // Уведомляем пользователя
              await ctx.telegram.sendMessage(
                ticket.user.tgId,
                `✅ Ваше обращение #${ticketId} было закрыто.\n\nЕсли у вас возникнут новые вопросы, вы можете создать новое обращение через "💬 Живой чат".`,
              );

              const keyboard =
                user.role.name === 'admin' ? ADMIN_KEYBOARD : SUPPORT_KEYBOARD;
              await ctx.reply('✅ Обращение закрыто', keyboard);
              return;
            }
          }
        }
      }

      // === ОБРАБОТКА КОМАНД КОРЗИНЫ ===

      // Добавление товара в корзину: /add123 2
      if (ctx.message.text.startsWith('/add')) {
        const match = ctx.message.text.match(/\/add(\d+)\s*(\d+)?/);
        if (match) {
          const productId = parseInt(match[1]);
          const quantity = match[2] ? parseInt(match[2]) : 1;

          const product = await this.productService.getProductById(productId);
          if (product) {
            const user = await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

            if (user) {
              await this.cartService.addToCart(user.id, productId, quantity);
              await ctx.reply(
                `✅ ${product.name} (${quantity} шт.) добавлен в корзину`,
              );
              return;
            }
          }
        }
      }

      // Изменение количества: /set 1 3
      if (ctx.message.text.startsWith('/set ')) {
        const parts = ctx.message.text.split(' ');
        if (parts.length === 3) {
          const itemIndex = parseInt(parts[1]) - 1;
          const quantity = parseInt(parts[2]);

          const user = await this.prisma.user.findUnique({
            where: { tgId: String(ctx.from.id) },
          });

          if (user) {
            const cartItems = await this.cartService.getCart(user.id);
            if (cartItems[itemIndex]) {
              await this.cartService.updateQuantity(
                user.id,
                cartItems[itemIndex].productId,
                quantity,
              );
              await ctx.reply('✅ Количество обновлено');
              return;
            }
          }
        }
      }

      // Удаление товара из корзины: /remove 1
      if (ctx.message.text.startsWith('/remove ')) {
        const itemIndex = parseInt(ctx.message.text.split(' ')[1]) - 1;

        const user = await this.prisma.user.findUnique({
          where: { tgId: String(ctx.from.id) },
        });

        if (user) {
          const cartItems = await this.cartService.getCart(user.id);
          if (cartItems[itemIndex]) {
            await this.cartService.removeFromCart(
              user.id,
              cartItems[itemIndex].productId,
            );
            await ctx.reply('✅ Товар удален из корзины');
            return;
          }
        }
      }

      // === ОБРАБОТКА ОФОРМЛЕНИЯ ЗАКАЗА ===

      if (state?.action === 'checkout_contact') {
        this.stateService.setState(ctx.from.id, {
          action: 'checkout_address',
          data: { contactInfo: ctx.message.text },
        });
        await ctx.reply('Шаг 2/3: Укажите адрес доставки:');
        return;
      }

      if (state?.action === 'checkout_address') {
        this.stateService.setState(ctx.from.id, {
          action: 'checkout_comment',
          data: {
            ...state.data,
            deliveryAddress: ctx.message.text,
          },
        });
        await ctx.reply(
          'Шаг 3/3: Добавьте комментарий к заказу или напишите "пропустить":',
        );
        return;
      }

      if (state?.action === 'checkout_comment') {
        const user = await this.prisma.user.findUnique({
          where: { tgId: String(ctx.from.id) },
        });

        if (!user) return;

        const comment =
          ctx.message.text.toLowerCase() === 'пропустить'
            ? undefined
            : ctx.message.text;

        try {
          const order = await this.cartService.createOrder(
            user.id,
            state.data.contactInfo,
            state.data.deliveryAddress,
            comment,
          );

          this.stateService.deleteState(ctx.from.id);

          const orderMessage = this.cartService.formatOrder(order);
          await ctx.reply(
            `✅ Заказ успешно оформлен!\n\n${orderMessage}\n\nМенеджер свяжется с вами в ближайшее время для подтверждения заказа.`,
            MAIN_KEYBOARD,
          );

          // Уведомляем менеджеров о новом заказе (ошибки не критичны)
          try {
            await this.notifyManagersNewOrder(ctx, order);
          } catch (notifyError) {
            console.error('Failed to notify managers:', notifyError);
          }
        } catch (error) {
          console.error('Error creating order:', error);
          await ctx.reply(
            '❌ Ошибка при оформлении заказа. Попробуйте снова.',
            MAIN_KEYBOARD,
          );
          this.stateService.deleteState(ctx.from.id);
        }
        return;
      }

      // === ОБРАБОТКА УСТАНОВКИ РЕГИОНА ===

      if (state?.action === 'set_region') {
        const user = await this.prisma.user.findUnique({
          where: { tgId: String(ctx.from.id) },
        });

        if (user) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { region: ctx.message.text },
          });

          // Переходим к заполнению анкеты
          this.stateService.setState(ctx.from.id, {
            action: 'profile_mse_date',
          });
          await ctx.reply(
            `✅ Регион "${ctx.message.text}" сохранен!\n\n📋 Теперь давайте заполним вашу анкету для получения ТСР.\n\n1️⃣ Укажите дату заключения МСЭ по ИПРа (в формате ДД.ММ.ГГГГ):\n\nЭто нужно для напоминаний о своевременном получении ТСР.\n\nНапример: 15.01.2024\n\nИли напишите "пропустить" для заполнения позже.`,
          );
        }
        return;
      }

      // === ОБРАБОТКА ЗАПОЛНЕНИЯ АНКЕТЫ ===

      if (state?.action === 'profile_mse_date') {
        const user = await this.prisma.user.findUnique({
          where: { tgId: String(ctx.from.id) },
        });

        if (!user) return;

        let mseDate: Date | undefined = undefined;
        if (ctx.message.text.toLowerCase() !== 'пропустить') {
          const dateParts = ctx.message.text.split('.');
          if (dateParts.length === 3) {
            mseDate = new Date(
              `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
            );
          }
        }

        this.stateService.setState(ctx.from.id, {
          action: 'profile_first_tsr_date',
          data: { mseDate },
        });

        await ctx.reply(
          '2️⃣ Укажите дату первого получения ТСР (в формате ДД.ММ.ГГГГ):\n\nЭто нужно для напоминаний о своевременном получении ТСР.\n\nИли напишите "пропустить".',
        );
        return;
      }

      if (state?.action === 'profile_first_tsr_date') {
        let firstTsrDate: Date | undefined = undefined;
        if (ctx.message.text.toLowerCase() !== 'пропустить') {
          const dateParts = ctx.message.text.split('.');
          if (dateParts.length === 3) {
            firstTsrDate = new Date(
              `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
            );
          }
        }

        this.stateService.setState(ctx.from.id, {
          action: 'profile_tsr_method',
          data: { ...state.data, firstTsrDate },
        });

        await ctx.reply(
          '3️⃣ Выберите способ получения ТСР:',
          Markup.keyboard([['Выдача'], ['Сертификат'], ['Пропустить']])
            .oneTime()
            .resize(),
        );
        return;
      }

      if (state?.action === 'profile_tsr_method') {
        const tsrMethod =
          ctx.message.text.toLowerCase() === 'пропустить'
            ? null
            : ctx.message.text;

        this.stateService.setState(ctx.from.id, {
          action: 'profile_tsr_types',
          data: { ...state.data, tsrMethod },
        });

        await ctx.reply(
          '4️⃣ Укажите виды назначенных ТСР (через запятую):\n\nНапример: Инвалидная коляска, Трость, Протезы\n\nИли напишите "пропустить".',
          Markup.removeKeyboard(),
        );
        return;
      }

      if (state?.action === 'profile_tsr_types') {
        const tsrTypes =
          ctx.message.text.toLowerCase() === 'пропустить'
            ? null
            : ctx.message.text;

        this.stateService.setState(ctx.from.id, {
          action: 'profile_next_tsr_date',
          data: { ...state.data, tsrTypes },
        });

        await ctx.reply(
          '5️⃣ Укажите дату следующего получения ТСР (в формате ДД.ММ.ГГГГ):\n\nЭто нужно для напоминаний о своевременном получении ТСР.\n\nИли напишите "пропустить".',
        );
        return;
      }

      if (state?.action === 'profile_next_tsr_date') {
        const user = await this.prisma.user.findUnique({
          where: { tgId: String(ctx.from.id) },
        });

        if (!user) return;

        let nextTsrDate: Date | undefined = undefined;
        if (ctx.message.text.toLowerCase() !== 'пропустить') {
          const dateParts = ctx.message.text.split('.');
          if (dateParts.length === 3) {
            nextTsrDate = new Date(
              `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
            );
          }
        }

        // Сохраняем профиль
        await this.profileService.createOrUpdateProfile(user.id, {
          mseDate: state.data.mseDate,
          firstTsrDate: state.data.firstTsrDate,
          tsrMethod: state.data.tsrMethod,
          tsrTypes: state.data.tsrTypes,
          nextTsrDate: nextTsrDate,
        });

        this.stateService.deleteState(ctx.from.id);

        await ctx.reply(
          '✅ Анкета успешно заполнена!\n\nВы можете посмотреть свой профиль и изменить данные в любое время, написав команду /profile',
          MAIN_KEYBOARD,
        );
        return;
      }

      // === ОБРАБОТКА РЕДАКТИРОВАНИЯ ПРОФИЛЯ ===

      if (state?.action === 'edit_profile_mse_date') {
        // Определяем, чей профиль редактируем
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        let mseDate: Date | undefined = undefined;
        if (ctx.message.text.toLowerCase() !== 'пропустить') {
          const dateParts = ctx.message.text.split('.');
          if (dateParts.length === 3) {
            mseDate = new Date(
              `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
            );
          }
        }

        await this.profileService.createOrUpdateProfile(user.id, { mseDate });

        this.stateService.deleteState(ctx.from.id);

        const keyboard = targetUser
          ? ADMIN_KEYBOARD
          : Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize();

        await ctx.reply(
          `✅ Дата МСЭ обновлена!${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
          keyboard,
        );
        return;
      }

      if (state?.action === 'edit_profile_first_tsr_date') {
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        let firstTsrDate: Date | undefined = undefined;
        if (ctx.message.text.toLowerCase() !== 'пропустить') {
          const dateParts = ctx.message.text.split('.');
          if (dateParts.length === 3) {
            firstTsrDate = new Date(
              `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
            );
          }
        }

        await this.profileService.createOrUpdateProfile(user.id, {
          firstTsrDate,
        });

        this.stateService.deleteState(ctx.from.id);

        const keyboard = targetUser
          ? ADMIN_KEYBOARD
          : Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize();

        await ctx.reply(
          `✅ Дата первого получения ТСР обновлена!${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
          keyboard,
        );
        return;
      }

      if (state?.action === 'edit_profile_next_tsr_date') {
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        let nextTsrDate: Date | undefined = undefined;
        if (ctx.message.text.toLowerCase() !== 'пропустить') {
          const dateParts = ctx.message.text.split('.');
          if (dateParts.length === 3) {
            nextTsrDate = new Date(
              `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`,
            );
          }
        }

        await this.profileService.createOrUpdateProfile(user.id, {
          nextTsrDate,
        });

        this.stateService.deleteState(ctx.from.id);

        const keyboard = targetUser
          ? ADMIN_KEYBOARD
          : Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize();

        await ctx.reply(
          `✅ Дата следующего получения ТСР обновлена!${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
          keyboard,
        );
        return;
      }

      if (state?.action === 'edit_profile_tsr_method') {
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        const tsrMethod =
          ctx.message.text.toLowerCase() === 'пропустить'
            ? undefined
            : ctx.message.text;

        await this.profileService.createOrUpdateProfile(user.id, { tsrMethod });

        this.stateService.deleteState(ctx.from.id);

        const keyboard = targetUser
          ? ADMIN_KEYBOARD
          : Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize();

        await ctx.reply(
          `✅ Способ получения ТСР обновлен!${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
          keyboard,
        );
        return;
      }

      if (state?.action === 'edit_profile_tsr_types') {
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        const tsrTypes =
          ctx.message.text.toLowerCase() === 'пропустить'
            ? undefined
            : ctx.message.text;

        await this.profileService.createOrUpdateProfile(user.id, { tsrTypes });

        this.stateService.deleteState(ctx.from.id);

        const keyboard = targetUser
          ? ADMIN_KEYBOARD
          : Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize();

        await ctx.reply(
          `✅ Виды ТСР обновлены!${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
          keyboard,
        );
        return;
      }

      if (state?.action === 'edit_profile_tsr_period') {
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        if (ctx.message.text.toLowerCase() === 'пропустить') {
          this.stateService.deleteState(ctx.from.id);
          await ctx.reply(
            '❌ Изменение отменено',
            Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize(),
          );
          return;
        }

        const periodMonths = parseInt(ctx.message.text);

        if (isNaN(periodMonths) || periodMonths < 1 || periodMonths > 24) {
          await ctx.reply(
            '❌ Неверное значение. Введите число от 1 до 24 месяцев:',
          );
          return;
        }

        try {
          await this.profileService.updateTsrPeriod(user.id, periodMonths);

          this.stateService.deleteState(ctx.from.id);

          const keyboard = targetUser
            ? ADMIN_KEYBOARD
            : Markup.keyboard([
                ['✏️ Редактировать профиль'],
                ['◀️ Назад'],
              ]).resize();

          await ctx.reply(
            `✅ Периодичность обновлена: каждые ${periodMonths} мес.\n\n` +
              `Дата следующего получения пересчитана автоматически.${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
            keyboard,
          );
        } catch (error) {
          await ctx.reply(
            '❌ Ошибка: не указана дата первого получения ТСР. Сначала заполните это поле.',
          );
        }
        return;
      }

      if (state?.action === 'edit_profile_reminder_days') {
        const targetUser = state.data?.targetUser;
        const user = targetUser
          ? targetUser
          : await this.prisma.user.findUnique({
              where: { tgId: String(ctx.from.id) },
            });

        if (!user) return;

        if (ctx.message.text.toLowerCase() === 'пропустить') {
          this.stateService.deleteState(ctx.from.id);
          await ctx.reply(
            '❌ Изменение отменено',
            Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize(),
          );
          return;
        }

        const reminderDays = parseInt(ctx.message.text);

        if (isNaN(reminderDays) || reminderDays < 1 || reminderDays > 60) {
          await ctx.reply(
            '❌ Неверное значение. Введите число от 1 до 60 дней:',
          );
          return;
        }

        await this.profileService.createOrUpdateProfile(user.id, {
          reminderDaysBefore: reminderDays,
        });

        this.stateService.deleteState(ctx.from.id);

        const keyboard = targetUser
          ? ADMIN_KEYBOARD
          : Markup.keyboard([
              ['✏️ Редактировать профиль'],
              ['◀️ Назад'],
            ]).resize();

        await ctx.reply(
          `✅ Срок напоминания обновлен: за ${reminderDays} дней до срока${targetUser ? ` (пользователь: @${targetUser.username || targetUser.firstName})` : ''}`,
          keyboard,
        );
        return;
      }

      // === ОБРАБОТКА СОСТОЯНИЙ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ ===

      if (state?.action === 'add_user') {
        await this.adminService.handleAddUserRole(ctx, ctx.message.text);
        return;
      }

      if (state?.action === 'add_role') {
        await this.adminService.handleUpdateUserRole(
          ctx,
          state.data.username,
          ctx.message.text,
        );
        return;
      }

      if (state?.action === 'edit_user_select') {
        await this.adminService.handleEditUserSelect(
          ctx,
          ctx.message.text,
          state.data.employees,
        );
        return;
      }

      if (state?.action === 'edit_user_role') {
        await this.adminService.handleEditUserRole(
          ctx,
          ctx.message.text,
          state.data.employee,
        );
        return;
      }

      if (state?.action === 'delete_user_select') {
        await this.adminService.handleDeleteUserSelect(
          ctx,
          ctx.message.text,
          state.data.employees,
        );
        return;
      }

      // === НОВЫЕ ОБРАБОТЧИКИ ПОИСКА И УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ ===

      if (state?.action === 'search_users') {
        await this.adminService.handleSearchUsers(ctx, ctx.message.text);
        return;
      }

      if (state?.action === 'select_user_action') {
        if (state.data?.users) {
          await this.adminService.handleSelectUserAction(
            ctx,
            ctx.message.text,
            state.data.users,
          );
        }
        return;
      }

      if (state?.action === 'block_user_reason') {
        if (state.data?.user) {
          const reason =
            ctx.message.text.toLowerCase() === 'пропустить'
              ? undefined
              : ctx.message.text;
          await this.adminService.blockUser(ctx, state.data.user.id, reason);
        }
        return;
      }

      if (state?.action === 'change_user_role') {
        if (state.data?.user) {
          const role = ctx.message.text.toLowerCase();
          if (['admin', 'support', 'user'].includes(role)) {
            await this.adminService.handleEditUserRole(
              ctx,
              role,
              state.data.user,
            );
          } else {
            await ctx.reply(
              '❌ Неверная роль. Выберите: admin, support или user',
            );
          }
        }
        return;
      }

      // === ОБРАБОТКА СОСТОЯНИЙ FAQ ===

      if (state?.action === 'add_question') {
        await this.adminService.handleAddQuestion(ctx, ctx.message.text);
        return;
      }

      if (state?.action === 'add_answer') {
        await this.adminService.handleAddAnswer(
          ctx,
          ctx.message.text,
          state.data.question,
        );
        return;
      }

      if (state?.action === 'edit_select') {
        await this.adminService.handleEditSelect(
          ctx,
          ctx.message.text,
          state.data.faqs,
        );
        return;
      }

      if (state?.action === 'edit_choose_field') {
        await this.adminService.handleEditChooseField(
          ctx,
          ctx.message.text,
          state.data.faq,
        );
        return;
      }

      if (state?.action === 'edit_enter_value') {
        await this.adminService.handleEditEnterValue(
          ctx,
          ctx.message.text,
          state.data.faq,
          state.data.field,
        );
        return;
      }

      if (state?.action === 'delete_select') {
        await this.adminService.handleDeleteSelect(
          ctx,
          ctx.message.text,
          state.data.faqs,
        );
        return;
      }

      // === ОБРАБОТКА СОСТОЯНИЙ УПРАВЛЕНИЯ ТОВАРАМИ ===

      if (state?.action === 'add_product_name') {
        await this.adminService.handleAddProductName(ctx, ctx.message.text);
        return;
      }

      if (state?.action === 'add_product_description') {
        await this.adminService.handleAddProductDescription(
          ctx,
          ctx.message.text,
          state.data.name,
        );
        return;
      }

      if (state?.action === 'add_product_images') {
        if (ctx.message.text.toLowerCase() === 'готово') {
          await this.adminService.handleAddProductImagesComplete(
            ctx,
            state.data,
          );
        }
        return;
      }

      if (state?.action === 'add_product_link') {
        await this.adminService.handleAddProductLink(
          ctx,
          ctx.message.text,
          state.data,
        );
        return;
      }

      if (state?.action === 'add_product_price') {
        await this.adminService.handleAddProductPrice(
          ctx,
          ctx.message.text,
          state.data,
        );
        return;
      }

      if (state?.action === 'edit_product_select') {
        await this.adminService.handleEditProductSelect(
          ctx,
          ctx.message.text,
          state.data.products,
        );
        return;
      }

      if (state?.action === 'edit_product_choose_field') {
        await this.adminService.handleEditProductChooseField(
          ctx,
          ctx.message.text,
          state.data.product,
        );
        return;
      }

      if (state?.action === 'edit_product_images') {
        if (ctx.message.text.toLowerCase() === 'готово') {
          await this.adminService.handleEditProductImagesComplete(
            ctx,
            state.data,
          );
        }
        return;
      }

      if (state?.action === 'edit_product_enter_value') {
        await this.adminService.handleEditProductEnterValue(
          ctx,
          ctx.message.text,
          state.data.product,
          state.data.field,
        );
        return;
      }

      if (state?.action === 'delete_product_select') {
        await this.adminService.handleDeleteProductSelect(
          ctx,
          ctx.message.text,
          state.data.products,
        );
        return;
      }

      // === ОБРАБОТКА СОСТОЯНИЙ РАССЫЛКИ ===

      if (state?.action === 'broadcast_select_filter') {
        if (ctx.message.text.toLowerCase() === 'отмена') {
          await this.adminService.handleBroadcastCancel(ctx);
        } else {
          await this.adminService.handleBroadcastSelectFilter(
            ctx,
            ctx.message.text,
          );
        }
        return;
      }

      if (state?.action === 'broadcast_personalization') {
        if (ctx.message.text.toLowerCase() === 'отмена') {
          await this.adminService.handleBroadcastCancel(ctx);
        } else {
          await this.adminService.handleBroadcastPersonalization(
            ctx,
            ctx.message.text,
          );
        }
        return;
      }

      if (state?.action === 'broadcast_message') {
        const text = ctx.message.text.toLowerCase();
        if (text === 'готово') {
          await this.adminService.handleBroadcastConfirm(ctx, state.data);
        } else if (text === 'отмена') {
          await this.adminService.handleBroadcastCancel(ctx);
        } else {
          await this.adminService.handleBroadcastText(
            ctx,
            ctx.message.text,
            state.data,
          );
        }
        return;
      }

      // === ОБЫЧНАЯ ОБРАБОТКА ===

      if (ctx.message.text == this.agree) {
        await this.handleUserAgreement(ctx);
      } else {
        // Сначала проверяем FAQ (приоритет выше чем чат поддержки)
        const faq = await this.faqService.getFaqByQuestion(ctx.message.text);
        if (faq) {
          await ctx.reply(
            `❓ ${faq.question}\n\n✅ ${faq.answer}`,
            Markup.keyboard([
              ['Поддержка', '💬 Живой чат'],
              ['◀️ Назад'],
            ]).resize(),
          );
          return;
        }

        // Проверяем, находится ли пользователь в режиме чата с поддержкой
        const user = await this.prisma.user.findUnique({
          where: { tgId: String(ctx.from.id) },
        });

        if (user) {
          const activeTicket =
            await this.supportService.getActiveTicketByUserId(user.id);

          if (activeTicket) {
            // Сохраняем сообщение в тикете
            await this.supportService.addMessage(
              activeTicket.id,
              user.id,
              ctx.message.text,
            );
            await ctx.reply('✅ Ваше сообщение отправлено в службу поддержки.');

            // Уведомляем службу поддержки
            await this.notifySupportNewMessage(
              ctx,
              activeTicket,
              user,
              ctx.message.text,
            );
            return;
          }
        }
      }
    }
  }

  private async notifySupportNewTicket(ctx: Context, user: any) {
    const supportUsers = await this.supportService.getSupportUsers();

    for (const supportUser of supportUsers) {
      try {
        await ctx.telegram.sendMessage(
          supportUser.tgId,
          `🆕 Новое обращение!\n\nПользователь: @${user.username || user.firstName}\nID: ${user.id}\n\nПерейдите в раздел "💬 Обращения" для просмотра.`,
        );
      } catch (error) {
        console.error(
          `Failed to notify support user ${supportUser.tgId}:`,
          error,
        );
      }
    }
  }

  private async notifySupportNewMessage(
    ctx: Context,
    ticket: any,
    user: any,
    message: string,
  ) {
    const supportUsers = await this.supportService.getSupportUsers();

    for (const supportUser of supportUsers) {
      try {
        await ctx.telegram.sendMessage(
          supportUser.tgId,
          `💬 Новое сообщение в обращении #${ticket.id}\n\nПользователь: @${user.username || user.firstName}\n\nСообщение: ${message}`,
        );
      } catch (error) {
        console.error(
          `Failed to notify support user ${supportUser.tgId}:`,
          error,
        );
      }
    }
  }

  private async handleUserAgreement(ctx: Context) {
    if (!ctx.from) return;

    const { id, first_name, username, last_name } = ctx.from;
    const checkUser = await this.userService.findByTgId(String(id));

    if (!checkUser) {
      const checkRole = await this.prisma.role.findFirst({
        where: { name: 'user' },
      });

      if (!checkRole) {
        throw new NotFoundException('Роль не найдена');
      }

      await this.prisma.user.create({
        data: {
          tgId: String(id),
          firstName: first_name,
          lastName: last_name,
          username,
          roleId: checkRole.id,
        },
      });

      // Запрашиваем регион
      this.stateService.setState(ctx.from.id, { action: 'set_region' });
      await ctx.reply(
        'Спасибо за согласие!\n\nУкажите ваш регион (город или область):',
        Markup.removeKeyboard(),
      );
      return;
    }

    await ctx.reply('Спасибо, ваше согласие получено!', MAIN_KEYBOARD);
  }

  private async notifyManagersNewOrder(ctx: Context, order: any) {
    const managers = await this.prisma.user.findMany({
      where: {
        role: {
          name: {
            in: ['admin', 'support'],
          },
        },
      },
    });

    const orderMessage = this.cartService.formatOrder(order);
    const userInfo = `Пользователь: @${order.user.username || order.user.firstName} (ID: ${order.user.id})`;

    for (const manager of managers) {
      try {
        await ctx.telegram.sendMessage(
          manager.tgId,
          `🆕 Новый заказ #${order.id}!\n\n${userInfo}\n\n${orderMessage}\n\nДля ответа клиенту используйте команду:\n/reply_order ${order.id} текст сообщения`,
        );
      } catch (error) {
        console.error(`Failed to notify manager ${manager.tgId}:`, error);
      }
    }
  }
}
