import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  /**
   * Validates if a user with a given role can create a user with a target role
   */
  private canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
    // SUPERADMIN can create any role
    if (creatorRole === UserRole.SUPERADMIN) {
      return true;
    }

    // ADMIN can only create CASHIER
    if (creatorRole === UserRole.ADMIN && targetRole === UserRole.CASHIER) {
      return true;
    }

    // CASHIER cannot create any users
    return false;
  }

  async create(createUserDto: CreateUserDto, creatorRole?: UserRole): Promise<User> {
    // Validate permissions if creatorRole is provided
    if (creatorRole) {
      const targetRole = createUserDto.role || UserRole.CASHIER;
      if (!this.canCreateRole(creatorRole, targetRole)) {
        throw new ForbiddenException(
          `El rol ${creatorRole} no tiene permisos para crear usuarios con rol ${targetRole}`
        );
      }
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto, updaterUserId?: string, updaterRole?: UserRole): Promise<User> {
    const user = await this.findOne(id);

    // Validar permisos de actualización
    if (updaterRole && updaterUserId) {
      // No permitir que un usuario se cambie su propio rol
      if (id === updaterUserId && updateUserDto.role && updateUserDto.role !== user.role) {
        throw new ForbiddenException('No puedes cambiar tu propio rol');
      }

      // ADMIN no puede modificar a otros ADMIN o SUPERADMIN
      if (updaterRole === UserRole.ADMIN && 
          (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) &&
          id !== updaterUserId) {
        throw new ForbiddenException('No tienes permisos para modificar a este usuario');
      }

      // ADMIN no puede asignar rol ADMIN o SUPERADMIN
      if (updaterRole === UserRole.ADMIN && 
          updateUserDto.role && 
          (updateUserDto.role === UserRole.ADMIN || updateUserDto.role === UserRole.SUPERADMIN)) {
        throw new ForbiddenException('No tienes permisos para asignar este rol');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string, deleterUserId?: string, deleterRole?: UserRole): Promise<void> {
    const user = await this.findOne(id);

    // No permitir eliminar el propio usuario
    if (deleterUserId && id === deleterUserId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    // Validar permisos según rol
    if (deleterRole) {
      // ADMIN solo puede eliminar CASHIER
      if (deleterRole === UserRole.ADMIN && user.role !== UserRole.CASHIER) {
        throw new ForbiddenException('Solo puedes eliminar usuarios con rol Cajero');
      }

      // Nadie puede eliminar a un SUPERADMIN excepto otro SUPERADMIN
      if (user.role === UserRole.SUPERADMIN && deleterRole !== UserRole.SUPERADMIN) {
        throw new ForbiddenException('No tienes permisos para eliminar a un Superadministrador');
      }
    }

    user.isActive = false;
    await this.usersRepository.save(user);
  }
}
