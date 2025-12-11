import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { TelegrafModule } from 'nestjs-telegraf';
import { UserModule } from '../user/user.module';
import { FaqService } from './services/faq.service';
import { AdminService } from './services/admin.service';
import { StateService } from './services/state.service';
import { EmployeeService } from './services/employee.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductService } from './services/product.service';
import { SupportService } from './services/support.service';
import { CartService } from './services/cart.service';
import { ProfileService } from './services/profile.service';
import { TasksService } from './services/tasks.service';

@Module({
  imports: [TelegrafModule, UserModule, PrismaModule],
  controllers: [BotController],
  providers: [
    BotService,
    FaqService,
    AdminService,
    StateService,
    EmployeeService,
    ProductService,
    SupportService,
    CartService,
    ProfileService,
    TasksService,
  ],
})
export class BotModule {}
