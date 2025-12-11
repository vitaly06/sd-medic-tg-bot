import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async createProduct(data: {
    name: string;
    description: string;
    images: string[];
    link?: string;
    price: number;
  }) {
    return this.prisma.product.create({
      data,
    });
  }

  async updateProduct(
    id: number,
    data: {
      name?: string;
      description?: string;
      images?: string[];
      link?: string;
      price?: number;
    },
  ) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: number) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  formatProductList(products: any[]) {
    if (products.length === 0) {
      return 'Список товаров пуст.';
    }

    return products
      .map((product, index) => {
        const linkText = product.link ? `\n🔗 Ссылка: ${product.link}` : '';
        return `${index + 1}. ${product.name}\n💰 Цена: ${product.price} руб.\n📝 ${product.description}${linkText}\n🖼 Картинок: ${product.images.length}`;
      })
      .join('\n\n');
  }

  formatProductNumberList(products: any[]) {
    if (products.length === 0) {
      return 'Список товаров пуст.';
    }

    return products
      .map(
        (product, index) =>
          `${index + 1}. ${product.name} (${product.price} руб.)`,
      )
      .join('\n');
  }
}
