import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const role = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });
    if (role) {
      return new HttpException('Role already exists', HttpStatus.CONFLICT);
    }
    const newRole = this.roleRepository.create(createRoleDto);

    return this.roleRepository.save(newRole);
  }

  async getRoles() {
    const roles = await this.roleRepository.find();
    return roles.filter((role) => !role.is_deleted);
  }

  async getRoleById(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
    });
    if (!role || role.is_deleted) {
      return new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    return role;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.preload({
      id,
      ...updateRoleDto,
    });
    if (!role || role.is_deleted) {
      return new HttpException('role not found', HttpStatus.NOT_FOUND);
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
    });
    if (!role || role.is_deleted) {
      return new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    role.is_deleted = true;

    return this.roleRepository.save(role);
  }
}
