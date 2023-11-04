import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesService } from 'src/roles/roles.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private roleServices: RolesService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (user) {
      return new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const role = await this.roleServices.getRoleById(
      createUserDto.role_id ?? 3,
    );
    if (role instanceof HttpException) return role;

    const newUser = this.userRepository.create(createUserDto);
    newUser.role = role;

    return this.userRepository.save(newUser);
  }

  async getUsers() {
    const users = await this.userRepository.find();
    return users.filter((user) => !user.is_deleted);
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user || user.is_deleted) {
      return new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!user || user.is_deleted) {
      return new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const role = await this.roleServices.getRoleById(user.role_id);
    if (role instanceof HttpException) return role;
    user.role = role;

    return this.userRepository.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user || user.is_deleted) {
      return new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    user.is_deleted = true;

    return this.userRepository.save(user);
  }
}
