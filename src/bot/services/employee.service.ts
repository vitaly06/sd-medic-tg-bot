import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: {
          NOT: { name: 'user' },
        },
      },
      include: {
        role: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findUserByUsername(username: string) {
    return this.prisma.user.findFirst({
      where: { username },
      include: { role: true },
    });
  }

  async updateUserRole(username: string, roleId: number) {
    return this.prisma.user.updateMany({
      where: { username },
      data: { roleId },
    });
  }

  async removeEmployeeRole(id: number) {
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'user' },
    });

    if (!userRole) {
      throw new Error('Роль user не найдена');
    }

    return this.prisma.user.update({
      where: { id },
      data: { roleId: userRole.id },
    });
  }

  formatEmployeeList(employees: any[]) {
    let message = '📋 Список пользователей-сотрудников:\n\n';
    employees.forEach((employee, index) => {
      message += `${index + 1}. @${employee.username} - ${employee.firstName || ''} ${employee.lastName || ''} (${employee.role.name})\n`;
    });
    return message;
  }

  formatEmployeeNumberList(employees: any[]) {
    let message = '';
    employees.forEach((employee, index) => {
      message += `${index + 1}. @${employee.username} (${employee.role.name})\n`;
    });
    return message;
  }
}
