import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(userId: number, productId: number, quantity: number = 1) {
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
    });
  }

  async getCart(userId: number) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateQuantity(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(userId, productId);
    }

    return this.prisma.cartItem.updateMany({
      where: {
        userId,
        productId,
      },
      data: {
        quantity,
      },
    });
  }

  async removeFromCart(userId: number, productId: number) {
    return this.prisma.cartItem.deleteMany({
      where: {
        userId,
        productId,
      },
    });
  }

  async clearCart(userId: number) {
    return this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  async createOrder(
    userId: number,
    contactInfo?: string,
    deliveryAddress?: string,
    comment?: string,
  ) {
    const cartItems = await this.getCart(userId);

    if (cartItems.length === 0) {
      throw new Error('Корзина пуста');
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        totalPrice,
        contactInfo,
        deliveryAddress,
        comment,
        status: 'pending',
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Очищаем корзину после создания заказа
    await this.clearCart(userId);

    return order;
  }

  formatCart(cartItems: any[]) {
    if (cartItems.length === 0) {
      return '🛒 Ваша корзина пуста';
    }

    let total = 0;
    const items = cartItems
      .map((item, index) => {
        const itemTotal = item.product.price * item.quantity;
        total += itemTotal;
        return `${index + 1}. ${item.product.name}\n   Цена: ${item.product.price} руб. × ${item.quantity} = ${itemTotal} руб.`;
      })
      .join('\n\n');

    return `🛒 Ваша корзина:\n\n${items}\n\n💰 Итого: ${total} руб.`;
  }

  formatOrder(order: any) {
    const items = order.items
      .map(
        (item: any, index: number) =>
          `${index + 1}. ${item.product.name} × ${item.quantity} = ${item.price * item.quantity} руб.`,
      )
      .join('\n');

    let details = '';
    if (order.contactInfo) details += `\n📞 Контакты: ${order.contactInfo}`;
    if (order.deliveryAddress)
      details += `\n📍 Адрес доставки: ${order.deliveryAddress}`;
    if (order.comment) details += `\n💬 Комментарий: ${order.comment}`;

    return `📦 Заказ #${order.id}\n\n${items}\n\n💰 Итого: ${order.totalPrice} руб.${details}`;
  }

  async getOrderById(orderId: number) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getAllPendingOrders() {
    return this.prisma.order.findMany({
      where: {
        status: 'pending',
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOrderStatus(
    orderId: number,
    status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled',
  ) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
