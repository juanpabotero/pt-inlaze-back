import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesService } from 'src/roles/roles.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface/jwt-payload.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private roleServices: RolesService,
    private jwtAuthService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const { password, ...userData } = createUserDto;

    const role = await this.roleServices.getRoleById(
      createUserDto.role_id ?? 3,
    );
    if (role instanceof HttpException) return role;

    const newUser = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 10),
      role,
    });

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
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    let user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!user || user.is_deleted) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const { password, ...userData } = user;

    const role = await this.roleServices.getRoleById(user.role_id);
    if (role instanceof HttpException) return role;

    user = {
      ...userData,
      password: bcrypt.hashSync(password, 10),
      role,
    };

    return this.userRepository.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user || user.is_deleted) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    user.is_deleted = true;

    return this.userRepository.save(user);
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });

    if (!user || user.is_deleted) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  private getJwtToken(payload: JwtPayload) {
    return this.jwtAuthService.sign(payload);
  }
}
