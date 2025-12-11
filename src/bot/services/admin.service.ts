import { Injectable } from '@nestjs/common';
import { Context, Markup } from 'telegraf';
import { FaqService } from './faq.service';
import { StateService } from './state.service';
import { EmployeeService } from './employee.service';
import { ProductService } from './product.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

const ADMIN_KEYBOARD = Markup.keyboard([
  'Настройка поддержки',
  'Управление пользователями',
  'Товары',
  'Рассылка',
  '📄 Экспорт базы',
]).resize();

@Injectable()
export class AdminService {
  constructor(
    private readonly faqService: FaqService,
    private readonly stateService: StateService,
    private readonly employeeService: EmployeeService,
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
  ) {}

  async showFaqManagement(ctx: Context) {
    const faqs = await this.faqService.getAllFaqs();
    let message;
    if (faqs.length === 0) {
      message = 'FAQ пока нет';
    } else {
      message = this.faqService.formatFaqList(faqs);
    }

    const keyboard = Markup.keyboard([
      ['➕ Добавить вопрос'],
      ['✏️ Редактировать вопрос'],
      ['🗑 Удалить вопрос'],
      ['◀️ Назад'],
    ]).resize();

    await ctx.reply(message, keyboard);
  }

  async startAddFaq(ctx: Context) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, { action: 'add_question' });
    await ctx.reply('Введите новый вопрос:', Markup.removeKeyboard());
  }

  async handleAddQuestion(ctx: Context, question: string) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, {
      action: 'add_answer',
      data: { question },
    });
    await ctx.reply('Теперь введите ответ на этот вопрос:');
  }

  async handleAddAnswer(ctx: Context, answer: string, question: string) {
    if (!ctx.from) return;
    await this.faqService.createFaq(question, answer);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ FAQ успешно добавлен!', ADMIN_KEYBOARD);
  }

  async startEditFaq(ctx: Context) {
    if (!ctx.from) return;
    const faqs = await this.faqService.getAllFaqs();

    if (faqs.length === 0) {
      await ctx.reply('FAQ пока нет');
      return;
    }

    const message =
      'Введите номер вопроса для редактирования:\n\n' +
      this.faqService.formatFaqNumberList(faqs);

    this.stateService.setState(ctx.from.id, {
      action: 'edit_select',
      data: { faqs },
    });
    await ctx.reply(message, Markup.removeKeyboard());
  }

  async handleEditSelect(ctx: Context, text: string, faqs: any[]) {
    if (!ctx.from) return;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= faqs.length) {
      await ctx.reply('❌ Неверный номер. Попробуйте снова:');
      return false;
    }

    const faq = faqs[index];
    this.stateService.setState(ctx.from.id, {
      action: 'edit_choose_field',
      data: { faq },
    });
    await ctx.reply(
      `Редактирование:\nВопрос: ${faq.question}\nОтвет: ${faq.answer}\n\nЧто изменить? Введите "вопрос" или "ответ":`,
    );
    return true;
  }

  async handleEditChooseField(ctx: Context, text: string, faq: any) {
    if (!ctx.from) return;
    const field = text.toLowerCase();

    if (field !== 'вопрос' && field !== 'ответ') {
      await ctx.reply('❌ Введите "вопрос" или "ответ":');
      return false;
    }

    this.stateService.setState(ctx.from.id, {
      action: 'edit_enter_value',
      data: { faq, field },
    });
    await ctx.reply(`Введите новый ${field}:`);
    return true;
  }

  async handleEditEnterValue(
    ctx: Context,
    text: string,
    faq: any,
    field: string,
  ) {
    if (!ctx.from) return;
    const updateData =
      field === 'вопрос' ? { question: text } : { answer: text };

    await this.faqService.updateFaq(faq.id, updateData);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ FAQ успешно обновлен!', ADMIN_KEYBOARD);
  }

  async startDeleteFaq(ctx: Context) {
    if (!ctx.from) return;
    const faqs = await this.faqService.getAllFaqs();

    if (faqs.length === 0) {
      await ctx.reply('FAQ пока нет');
      return;
    }

    const message =
      'Введите номер вопроса для удаления:\n\n' +
      this.faqService.formatFaqNumberList(faqs);

    this.stateService.setState(ctx.from.id, {
      action: 'delete_select',
      data: { faqs },
    });
    await ctx.reply(message, Markup.removeKeyboard());
  }

  async handleDeleteSelect(ctx: Context, text: string, faqs: any[]) {
    if (!ctx.from) return;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= faqs.length) {
      await ctx.reply('❌ Неверный номер. Попробуйте снова:');
      return false;
    }

    const faq = faqs[index];
    await this.faqService.deleteFaq(faq.id);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ FAQ успешно удален!', ADMIN_KEYBOARD);
    return true;
  }

  // === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===

  async manageUsers(ctx: Context) {
    const employees = await this.employeeService.getAllEmployees();

    if (employees.length === 0) {
      await ctx.reply('Пользователи-сотрудники не найдены');
      return;
    }

    const message = this.employeeService.formatEmployeeList(employees);
    const keyboard = Markup.keyboard([
      ['➕ Добавить сотрудника'],
      ['✏️ Редактировать сотрудника'],
      ['🗑 Удалить сотрудника'],
      ['◀️ Назад'],
    ]).resize();

    await ctx.reply(message, keyboard);
  }

  async startAddUser(ctx: Context) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, { action: 'add_user' });
    await ctx.reply(
      'Введите username нового сотрудника:',
      Markup.removeKeyboard(),
    );
  }

  async handleAddUserRole(ctx: Context, username: string) {
    if (!ctx.from) return;
    const checkUser = await this.employeeService.findUserByUsername(username);

    if (!checkUser) {
      await ctx.reply(
        'Вы не можете назначать роль пользователю, который не запускал бота!',
        ADMIN_KEYBOARD,
      );
      this.stateService.deleteState(ctx.from.id);
      return;
    }

    this.stateService.setState(ctx.from.id, {
      action: 'add_role',
      data: { username },
    });
    await ctx.reply(
      'Теперь выберите роль:',
      Markup.keyboard(['admin', 'support']).oneTime().resize(),
    );
  }

  async handleUpdateUserRole(ctx: Context, username: string, roleName: string) {
    if (!ctx.from) return;

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      await ctx.reply('❌ Роль не найдена!');
      return;
    }

    await this.employeeService.updateUserRole(username, role.id);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Роль успешно обновлена!', ADMIN_KEYBOARD);
  }

  async startEditUser(ctx: Context) {
    if (!ctx.from) return;
    const employees = await this.employeeService.getAllEmployees();

    if (employees.length === 0) {
      await ctx.reply('Сотрудников пока нет');
      return;
    }

    const message =
      'Введите номер сотрудника для редактирования:\n\n' +
      this.employeeService.formatEmployeeNumberList(employees);

    this.stateService.setState(ctx.from.id, {
      action: 'edit_user_select',
      data: { employees },
    });
    await ctx.reply(message, Markup.removeKeyboard());
  }

  async handleEditUserSelect(ctx: Context, text: string, employees: any[]) {
    if (!ctx.from) return;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= employees.length) {
      await ctx.reply('❌ Неверный номер. Попробуйте снова:');
      return false;
    }

    const employee = employees[index];
    this.stateService.setState(ctx.from.id, {
      action: 'edit_user_role',
      data: { employee },
    });
    await ctx.reply(
      `Редактирование сотрудника @${employee.username}\nТекущая роль: ${employee.role.name}\n\nВведите новую роль:`,
      Markup.keyboard(['admin', 'support', 'user']).oneTime().resize(),
    );
    return true;
  }

  async handleEditUserRole(ctx: Context, text: string, employee: any) {
    if (!ctx.from) return;
    const roleName = text.toLowerCase();

    if (roleName !== 'admin' && roleName !== 'support' && roleName !== 'user') {
      await ctx.reply('❌ Введите "admin", "support" или "user":');
      return false;
    }

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      await ctx.reply('❌ Роль не найдена!');
      return false;
    }

    await this.employeeService.updateUserRole(employee.username, role.id);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Роль сотрудника успешно обновлена!', ADMIN_KEYBOARD);
    return true;
  }

  async startDeleteUser(ctx: Context) {
    if (!ctx.from) return;
    const employees = await this.employeeService.getAllEmployees();

    if (employees.length === 0) {
      await ctx.reply('Сотрудников пока нет');
      return;
    }

    const message =
      'Введите номер сотрудника для удаления:\n\n' +
      this.employeeService.formatEmployeeNumberList(employees);

    this.stateService.setState(ctx.from.id, {
      action: 'delete_user_select',
      data: { employees },
    });
    await ctx.reply(message, Markup.removeKeyboard());
  }

  async handleDeleteUserSelect(ctx: Context, text: string, employees: any[]) {
    if (!ctx.from) return;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= employees.length) {
      await ctx.reply('❌ Неверный номер. Попробуйте снова:');
      return false;
    }

    const employee = employees[index];
    await this.employeeService.removeEmployeeRole(employee.id);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Роль сотрудника изменена на "user"!', ADMIN_KEYBOARD);
    return true;
  }

  // === УПРАВЛЕНИЕ ТОВАРАМИ ===

  async manageProducts(ctx: Context) {
    const products = await this.productService.getAllProducts();

    const keyboard = Markup.keyboard([
      ['➕ Добавить товар'],
      ['✏️ Редактировать товар'],
      ['🗑 Удалить товар'],
      ['◀️ Назад'],
    ]).resize();

    if (products.length === 0) {
      await ctx.reply('Товары пока не добавлены', keyboard);
      return;
    }

    // Отправляем каждый товар с его первой картинкой
    for (const product of products) {
      const linkText = product.link ? `\n🔗 Ссылка: ${product.link}` : '';
      const caption = `📦 ${product.name}\n\n💰 Цена: ${product.price} руб.\n\n📝 ${product.description}${linkText}\n\n🖼 Всего картинок: ${product.images.length}`;

      if (product.images && product.images.length > 0) {
        await ctx.replyWithPhoto(product.images[0], { caption });
      } else {
        await ctx.reply(caption);
      }
    }

    await ctx.reply('Выберите действие:', keyboard);
  }

  async startAddProduct(ctx: Context) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, {
      action: 'add_product_name',
    });
    await ctx.reply('Введите название товара:', Markup.removeKeyboard());
  }

  async handleAddProductName(ctx: Context, name: string) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, {
      action: 'add_product_description',
      data: { name },
    });
    await ctx.reply('Теперь введите описание товара:');
  }

  async handleAddProductDescription(
    ctx: Context,
    description: string,
    name: string,
  ) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, {
      action: 'add_product_images',
      data: { name, description },
    });
    await ctx.reply(
      'Отправьте картинку(-и) товара. После того как отправите все картинки, напишите "готово":',
    );
  }

  async handleAddProductImages(ctx: Context, data: any) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    if (!state || !state.data) return;

    // Инициализируем массив картинок если его нет
    if (!state.data.images) {
      state.data.images = [];
    }

    // Добавляем fileId картинки
    if (ctx.message && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      state.data.images.push(photo.file_id);
      this.stateService.setState(ctx.from.id, state);
      await ctx.reply(
        `Картинка добавлена (всего: ${state.data.images.length}). Отправьте ещё или напишите "готово":`,
      );
    }
  }

  async handleAddProductImagesComplete(ctx: Context, data: any) {
    if (!ctx.from) return;

    if (!data.images || data.images.length === 0) {
      await ctx.reply('❌ Необходимо добавить хотя бы одну картинку!');
      return;
    }

    this.stateService.setState(ctx.from.id, {
      action: 'add_product_link',
      data,
    });
    await ctx.reply(
      'Введите ссылку на товар (или напишите "пропустить" если ссылки нет):',
    );
  }

  async handleAddProductLink(ctx: Context, link: string, data: any) {
    if (!ctx.from) return;
    const productLink = link.toLowerCase() === 'пропустить' ? null : link;

    this.stateService.setState(ctx.from.id, {
      action: 'add_product_price',
      data: { ...data, link: productLink },
    });
    await ctx.reply('Введите цену товара (в рублях):');
  }

  async handleAddProductPrice(ctx: Context, priceText: string, data: any) {
    if (!ctx.from) return;
    const price = parseFloat(priceText);

    if (isNaN(price) || price <= 0) {
      await ctx.reply('❌ Неверная цена. Введите число больше 0:');
      return;
    }

    await this.productService.createProduct({
      name: data.name,
      description: data.description,
      images: data.images,
      link: data.link,
      price,
    });

    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Товар успешно добавлен!', ADMIN_KEYBOARD);
  }

  async startEditProduct(ctx: Context) {
    if (!ctx.from) return;
    const products = await this.productService.getAllProducts();

    if (products.length === 0) {
      await ctx.reply('Товары пока не добавлены');
      return;
    }

    const message =
      'Введите номер товара для редактирования:\n\n' +
      this.productService.formatProductNumberList(products);

    this.stateService.setState(ctx.from.id, {
      action: 'edit_product_select',
      data: { products },
    });
    await ctx.reply(message, Markup.removeKeyboard());
  }

  async handleEditProductSelect(ctx: Context, text: string, products: any[]) {
    if (!ctx.from) return;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= products.length) {
      await ctx.reply('❌ Неверный номер. Попробуйте снова:');
      return false;
    }

    const product = products[index];
    this.stateService.setState(ctx.from.id, {
      action: 'edit_product_choose_field',
      data: { product },
    });
    await ctx.reply(
      `Редактирование товара: ${product.name}\n\nЧто изменить? Введите:\n"название", "описание", "картинки", "ссылка" или "цена":`,
    );
    return true;
  }

  async handleEditProductChooseField(ctx: Context, text: string, product: any) {
    if (!ctx.from) return;
    const field = text.toLowerCase();

    if (
      field !== 'название' &&
      field !== 'описание' &&
      field !== 'картинки' &&
      field !== 'ссылка' &&
      field !== 'цена'
    ) {
      await ctx.reply(
        '❌ Введите "название", "описание", "картинки", "ссылка" или "цена":',
      );
      return false;
    }

    if (field === 'картинки') {
      this.stateService.setState(ctx.from.id, {
        action: 'edit_product_images',
        data: { product, images: [] },
      });
      await ctx.reply(
        'Отправьте новые картинки. После отправки всех картинок напишите "готово":',
      );
    } else {
      this.stateService.setState(ctx.from.id, {
        action: 'edit_product_enter_value',
        data: { product, field },
      });
      await ctx.reply(`Введите новое значение для "${field}":`);
    }
    return true;
  }

  async handleEditProductImages(ctx: Context, data: any) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    if (!state || !state.data) return;

    if (ctx.message && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      state.data.images.push(photo.file_id);
      this.stateService.setState(ctx.from.id, state);
      await ctx.reply(
        `Картинка добавлена (всего: ${state.data.images.length}). Отправьте ещё или напишите "готово":`,
      );
    }
  }

  async handleEditProductImagesComplete(ctx: Context, data: any) {
    if (!ctx.from) return;

    if (!data.images || data.images.length === 0) {
      await ctx.reply('❌ Необходимо добавить хотя бы одну картинку!');
      return;
    }

    await this.productService.updateProduct(data.product.id, {
      images: data.images,
    });

    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Картинки товара успешно обновлены!', ADMIN_KEYBOARD);
  }

  async handleEditProductEnterValue(
    ctx: Context,
    text: string,
    product: any,
    field: string,
  ) {
    if (!ctx.from) return;

    let updateData: any = {};

    if (field === 'название') {
      updateData.name = text;
    } else if (field === 'описание') {
      updateData.description = text;
    } else if (field === 'ссылка') {
      updateData.link = text.toLowerCase() === 'пропустить' ? null : text;
    } else if (field === 'цена') {
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) {
        await ctx.reply('❌ Неверная цена. Введите число больше 0:');
        return false;
      }
      updateData.price = price;
    }

    await this.productService.updateProduct(product.id, updateData);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Товар успешно обновлен!', ADMIN_KEYBOARD);
    return true;
  }

  async startDeleteProduct(ctx: Context) {
    if (!ctx.from) return;
    const products = await this.productService.getAllProducts();

    if (products.length === 0) {
      await ctx.reply('Товары пока не добавлены');
      return;
    }

    const message =
      'Введите номер товара для удаления:\n\n' +
      this.productService.formatProductNumberList(products);

    this.stateService.setState(ctx.from.id, {
      action: 'delete_product_select',
      data: { products },
    });
    await ctx.reply(message, Markup.removeKeyboard());
  }

  async handleDeleteProductSelect(ctx: Context, text: string, products: any[]) {
    if (!ctx.from) return;
    const index = parseInt(text) - 1;

    if (isNaN(index) || index < 0 || index >= products.length) {
      await ctx.reply('❌ Неверный номер. Попробуйте снова:');
      return false;
    }

    const product = products[index];
    await this.productService.deleteProduct(product.id);
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('✅ Товар успешно удален!', ADMIN_KEYBOARD);
    return true;
  }

  // === РАССЫЛКА ===

  async startBroadcast(ctx: Context) {
    if (!ctx.from) return;
    this.stateService.setState(ctx.from.id, {
      action: 'broadcast_select_filter',
      data: { filters: {} },
    });
    await ctx.reply(
      '📢 Рассылка сообщений\n\n📋 Выберите критерии сегментации:\n\n' +
        '1️⃣ "все" - все пользователи\n' +
        '2️⃣ "регион: Москва" - по региону\n' +
        '3️⃣ "тср: коляска" - по виду ТСР\n' +
        '4️⃣ "способ: сертификат" - по способу получения\n' +
        '5️⃣ "комбо: регион=Москва, тср=коляска" - несколько фильтров\n\n' +
        '💡 Примеры:\n' +
        '• "регион: Санкт-Петербург"\n' +
        '• "тср: протезы"\n' +
        '• "способ: выдача"\n' +
        '• "комбо: регион=Краснодар, способ=сертификат"\n\n' +
        '❌ "отмена" - отменить рассылку',
      Markup.removeKeyboard(),
    );
  }

  async handleBroadcastSelectFilter(ctx: Context, text: string) {
    if (!ctx.from) return;

    const filters: any = {};
    let filterDescription = 'для всех пользователей';

    const lowerText = text.toLowerCase().trim();

    if (lowerText !== 'все') {
      // Парсим фильтры
      if (lowerText.startsWith('комбо:')) {
        // Комбинированные фильтры: "комбо: регион=Москва, тср=коляска"
        const filterParts = lowerText
          .replace('комбо:', '')
          .split(',')
          .map((s) => s.trim());

        const descriptions: string[] = [];

        for (const part of filterParts) {
          const [key, value] = part.split('=').map((s) => s.trim());

          if (key === 'регион' && value) {
            filters.region = value;
            descriptions.push(`регион "${value}"`);
          } else if (key === 'тср' && value) {
            filters.tsrType = value;
            descriptions.push(`ТСР "${value}"`);
          } else if (key === 'способ' && value) {
            filters.tsrMethod = value;
            descriptions.push(`способ "${value}"`);
          }
        }

        filterDescription =
          descriptions.length > 0 ? descriptions.join(' и ') : 'все';
      } else if (lowerText.startsWith('регион:')) {
        // Фильтр по региону
        filters.region = text.replace(/регион:/i, '').trim();
        filterDescription = `регион "${filters.region}"`;
      } else if (lowerText.startsWith('тср:')) {
        // Фильтр по виду ТСР
        filters.tsrType = text.replace(/тср:/i, '').trim();
        filterDescription = `вид ТСР "${filters.tsrType}"`;
      } else if (lowerText.startsWith('способ:')) {
        // Фильтр по способу получения
        filters.tsrMethod = text.replace(/способ:/i, '').trim();
        filterDescription = `способ получения "${filters.tsrMethod}"`;
      } else {
        await ctx.reply(
          '❌ Неверный формат. Примеры:\n' +
            '• "все"\n' +
            '• "регион: Москва"\n' +
            '• "тср: коляска"\n' +
            '• "способ: сертификат"\n' +
            '• "комбо: регион=Москва, тср=коляска"',
        );
        return;
      }
    }

    this.stateService.setState(ctx.from.id, {
      action: 'broadcast_personalization',
      data: { photos: [], filters },
    });

    await ctx.reply(
      `✅ Сегмент: ${filterDescription}\n\n` +
        `📝 Персонализация сообщения:\n\n` +
        `Вы можете использовать переменные в тексте:\n` +
        `• {{имя}} - имя пользователя\n` +
        `• {{регион}} - регион пользователя\n` +
        `• {{тср}} - виды ТСР\n` +
        `• {{дата_тср}} - следующая дата получения ТСР\n\n` +
        `Напишите "да" для использования персонализации или "нет" чтобы пропустить:`,
    );
  }

  async handleBroadcastPersonalization(ctx: Context, text: string) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);
    if (!state || !state.data) return;

    const usePersonalization = text.toLowerCase() === 'да';
    state.data.usePersonalization = usePersonalization;

    this.stateService.setState(ctx.from.id, {
      action: 'broadcast_message',
      data: state.data,
    });

    const personalizationHint = usePersonalization
      ? '\n\n💡 Используйте переменные: {{имя}}, {{регион}}, {{тср}}, {{дата_тср}}'
      : '';

    await ctx.reply(
      `Отправьте сообщение для рассылки.${personalizationHint}\n\n` +
        `Вы можете:\n` +
        `- Написать текст\n` +
        `- Отправить фото (можно несколько)\n` +
        `- Добавить ссылки в тексте\n\n` +
        `После отправки всех материалов напишите "готово" для подтверждения или "отмена" для отмены.`,
    );
  }

  async handleBroadcastPhoto(ctx: Context, data: any) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    if (!state || !state.data) return;

    if (ctx.message && 'photo' in ctx.message) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      if (!state.data.photos) {
        state.data.photos = [];
      }
      state.data.photos.push(photo.file_id);
      this.stateService.setState(ctx.from.id, state);
      await ctx.reply(
        `Фото добавлено (всего: ${state.data.photos.length}). Отправьте ещё материалы или напишите "готово":`,
      );
    }
  }

  async handleBroadcastText(ctx: Context, text: string, data: any) {
    if (!ctx.from) return;
    const state = this.stateService.getState(ctx.from.id);

    if (!state || !state.data) return;

    // Сохраняем текст
    state.data.text = text;
    this.stateService.setState(ctx.from.id, state);
    await ctx.reply(
      `Текст добавлен. Можете отправить фото или напишите "готово" для начала рассылки.`,
    );
  }

  async handleBroadcastConfirm(ctx: Context, data: any) {
    if (!ctx.from) return;

    if (!data.text && (!data.photos || data.photos.length === 0)) {
      await ctx.reply(
        '❌ Необходимо добавить хотя бы текст или фото для рассылки!',
      );
      return;
    }

    // Строим запрос с фильтрами
    const whereClause: any = {};
    const filters = data.filters || {};

    if (filters.region) {
      whereClause.region = {
        contains: filters.region,
        mode: 'insensitive',
      };
    }

    // Для фильтров по профилю нужен include
    const includeClause =
      filters.tsrType || filters.tsrMethod ? { profile: true } : undefined;

    const allUsers = await this.prisma.user.findMany({
      where: whereClause,
      include: includeClause,
    });

    // Дополнительная фильтрация по профилю
    let users = allUsers;

    if (filters.tsrType) {
      users = users.filter(
        (user: any) =>
          user.profile &&
          user.profile.tsrTypes &&
          user.profile.tsrTypes
            .toLowerCase()
            .includes(filters.tsrType.toLowerCase()),
      );
    }

    if (filters.tsrMethod) {
      users = users.filter(
        (user: any) =>
          user.profile &&
          user.profile.tsrMethod &&
          user.profile.tsrMethod
            .toLowerCase()
            .includes(filters.tsrMethod.toLowerCase()),
      );
    }

    if (users.length === 0) {
      await ctx.reply(
        '❌ По заданным фильтрам не найдено ни одного пользователя!',
      );
      this.stateService.deleteState(ctx.from.id);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    await ctx.reply(
      `Начинаю рассылку для ${users.length} пользователей...`,
      ADMIN_KEYBOARD,
    );

    // Отправляем сообщения всем пользователям
    for (const user of users) {
      try {
        // Персонализация текста
        let personalizedText = data.text || '';

        if (data.usePersonalization && personalizedText) {
          // Получаем профиль если его еще нет
          const userWithProfile: any = (user as any).profile
            ? user
            : await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { profile: true },
              });

          personalizedText = this.personalizeMessage(
            personalizedText,
            userWithProfile,
          );
        }

        if (data.photos && data.photos.length > 0) {
          // Если есть фото
          if (data.photos.length === 1) {
            // Одно фото с подписью
            await ctx.telegram.sendPhoto(user.tgId, data.photos[0], {
              caption: personalizedText,
            });
          } else {
            // Несколько фото - отправляем по одному
            for (const photo of data.photos) {
              await ctx.telegram.sendPhoto(user.tgId, photo);
            }
            // Если есть текст, отправляем отдельно
            if (personalizedText) {
              await ctx.telegram.sendMessage(user.tgId, personalizedText);
            }
          }
        } else if (personalizedText) {
          // Только текст
          await ctx.telegram.sendMessage(user.tgId, personalizedText);
        }
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to send message to user ${user.tgId}:`, error);
      }
    }

    this.stateService.deleteState(ctx.from.id);

    // Формируем описание фильтров
    const filterDescriptions: string[] = [];
    if (filters.region) filterDescriptions.push(`регион: ${filters.region}`);
    if (filters.tsrType) filterDescriptions.push(`ТСР: ${filters.tsrType}`);
    if (filters.tsrMethod)
      filterDescriptions.push(`способ: ${filters.tsrMethod}`);
    const filtersText =
      filterDescriptions.length > 0
        ? ` (${filterDescriptions.join(', ')})`
        : '';

    await ctx.reply(
      `✅ Рассылка завершена${filtersText}!\n\n` +
        `Всего получателей: ${users.length}\n` +
        `Успешно отправлено: ${successCount}\n` +
        `Ошибок: ${errorCount}` +
        (data.usePersonalization ? '\n\n✨ Сообщения персонализированы' : ''),
      ADMIN_KEYBOARD,
    );
  }

  async handleBroadcastCancel(ctx: Context) {
    if (!ctx.from) return;
    this.stateService.deleteState(ctx.from.id);
    await ctx.reply('❌ Рассылка отменена', ADMIN_KEYBOARD);
  }

  // Персонализация сообщений
  private personalizeMessage(text: string, user: any): string {
    let result = text;

    // {{имя}} - имя пользователя
    const userName = user.firstName || user.username || 'пользователь';
    result = result.replace(/\{\{имя\}\}/gi, userName);

    // {{регион}} - регион
    if (user.region) {
      result = result.replace(/\{\{регион\}\}/gi, user.region);
    } else {
      result = result.replace(/\{\{регион\}\}/gi, 'ваш регион');
    }

    // {{тср}} - виды ТСР
    if (user.profile?.tsrTypes) {
      result = result.replace(/\{\{тср\}\}/gi, user.profile.tsrTypes);
    } else {
      result = result.replace(/\{\{тср\}\}/gi, 'назначенные ТСР');
    }

    // {{дата_тср}} - следующая дата получения ТСР
    if (user.profile?.nextTsrDate) {
      const dateStr = new Date(user.profile.nextTsrDate).toLocaleDateString(
        'ru-RU',
      );
      result = result.replace(/\{\{дата_тср\}\}/gi, dateStr);
    } else {
      result = result.replace(
        /\{\{дата_тср\}\}/gi,
        'следующая дата получения ТСР',
      );
    }

    return result;
  }

  async exportUsersToExcel(ctx: Context) {
    try {
      // Получаем всех пользователей с их данными
      const users = await this.prisma.user.findMany({
        include: {
          role: true,
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          supportTickets: {
            include: {
              messages: true,
            },
          },
          profile: true,
        },
      });

      // Формируем данные для Excel
      const excelData = users.map((user) => {
        const totalOrders = user.orders.length;
        const totalSpent = user.orders.reduce(
          (sum, order) => sum + order.totalPrice,
          0,
        );
        const lastOrder =
          user.orders.length > 0
            ? new Date(
                user.orders[user.orders.length - 1].createdAt,
              ).toLocaleDateString('ru-RU')
            : 'Нет заказов';

        return {
          'ID пользователя': user.id,
          'Telegram ID': user.tgId,
          Имя: user.firstName || '',
          Фамилия: user.lastName || '',
          Username: user.username ? `@${user.username}` : '',
          Регион: user.region || '',
          Телефон: user.phone || '',
          Роль: user.role.name,
          'Дата МСЭ по ИПРа': user.profile?.mseDate
            ? new Date(user.profile.mseDate).toLocaleDateString('ru-RU')
            : '',
          'Дата первого получения ТСР': user.profile?.firstTsrDate
            ? new Date(user.profile.firstTsrDate).toLocaleDateString('ru-RU')
            : '',
          'Способ получения ТСР': user.profile?.tsrMethod || '',
          'Виды ТСР': user.profile?.tsrTypes || '',
          'Периодичность (мес)': user.profile?.tsrPeriodMonths || 3,
          'Следующее получение ТСР': user.profile?.nextTsrDate
            ? new Date(user.profile.nextTsrDate).toLocaleDateString('ru-RU')
            : '',
          'Напоминание за (дн)': user.profile?.reminderDaysBefore || 21,
          Уведомления: user.profile?.notificationsEnabled ? 'Да' : 'Нет',
          'Последнее напоминание': user.profile?.lastReminderSent
            ? new Date(user.profile.lastReminderSent).toLocaleDateString(
                'ru-RU',
              )
            : '',
          'Количество заказов': totalOrders,
          'Общая сумма заказов (руб)': totalSpent,
          'Последний заказ': lastOrder,
          'Обращений в поддержку': user.supportTickets.length,
          'Дата регистрации': user.id, // Используем ID как показатель порядка регистрации
        };
      });

      // Создаем рабочую книгу
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Пользователи');

      // Настраиваем ширину колонок
      const columnWidths = [
        { wch: 15 }, // ID пользователя
        { wch: 15 }, // Telegram ID
        { wch: 20 }, // Имя
        { wch: 20 }, // Фамилия
        { wch: 20 }, // Username
        { wch: 25 }, // Регион
        { wch: 18 }, // Телефон
        { wch: 15 }, // Роль
        { wch: 20 }, // Дата МСЭ по ИПРа
        { wch: 30 }, // Дата первого получения ТСР
        { wch: 25 }, // Способ получения ТСР
        { wch: 40 }, // Виды ТСР
        { wch: 20 }, // Периодичность (мес)
        { wch: 30 }, // Следующее получение ТСР
        { wch: 20 }, // Напоминание за (дн)
        { wch: 15 }, // Уведомления
        { wch: 25 }, // Последнее напоминание
        { wch: 20 }, // Количество заказов
        { wch: 25 }, // Общая сумма заказов
        { wch: 20 }, // Последний заказ
        { wch: 25 }, // Обращений в поддержку
        { wch: 20 }, // Дата регистрации
      ];
      worksheet['!cols'] = columnWidths;

      // Генерируем имя файла с датой
      const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = join(process.cwd(), 'exports', fileName);

      // Создаем директорию если её нет
      const { mkdirSync, existsSync } = await import('fs');
      const exportsDir = join(process.cwd(), 'exports');
      if (!existsSync(exportsDir)) {
        mkdirSync(exportsDir, { recursive: true });
      }

      // Сохраняем файл
      XLSX.writeFile(workbook, filePath);

      // Отправляем файл пользователю
      await ctx.replyWithDocument(
        { source: filePath, filename: fileName },
        {
          caption: `📊 Экспорт базы пользователей\n\nВсего пользователей: ${users.length}\nДата экспорта: ${new Date().toLocaleString('ru-RU')}`,
        },
      );

      await ctx.reply('✅ Экспорт успешно выполнен!', ADMIN_KEYBOARD);

      // Удаляем временный файл (опционально)
      const { unlinkSync } = await import('fs');
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.error('Failed to delete temporary file:', error);
      }
    } catch (error) {
      console.error('Export error:', error);
      await ctx.reply(
        '❌ Ошибка при экспорте базы данных. Попробуйте позже.',
        ADMIN_KEYBOARD,
      );
    }
  }
}
