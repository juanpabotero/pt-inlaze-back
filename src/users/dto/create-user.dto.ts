export class CreateUserDto {
  full_name: string;
  email: string;
  password: string;
  phone: number;
  role_id?: number;
}
