// dto层用来验证数据
// class-validator用来验证数据
import { IsEmail, IsMobilePhone, IsNotEmpty } from "class-validator";
// class-transformer用来转换数据
import { Sex } from "@prisma/client";
import { Transform } from "class-transformer";

export class UserDto {
  @IsNotEmpty({ message: "用户名是必填的" })
  @Transform((user) => user.value.trim())
  username: string;

  @IsNotEmpty({ message: "邮箱是必填的" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;

  @IsNotEmpty({ message: "手机号是必填的" })
  @IsMobilePhone("zh-CN", {}, { message: "手机号格式不正确" })
  phone: string;

  @IsNotEmpty({ message: "密码是必填的" })
  password: string;
}

export class UpdateUserDto {
  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;

  @IsNotEmpty({ message: "手机号是必填的" })
  @IsMobilePhone("zh-CN", {}, { message: "手机号格式不正确" })
  phone: string;

  @IsNotEmpty({ message: "姓名是必填的" })
  @Transform((name) => name.value.trim())
  name: string;

  sex: Sex;
  id: number;
  city?: string;
  address?: string;
  addressDetail?: string;
}

export class LoginDto {
  @IsNotEmpty({ message: "用户名是必填的" })
  @Transform((user) => user.value.trim())
  username: string;

  @IsNotEmpty({ message: "密码是必填的" })
  @Transform((password) => password.value.trim())
  password: string;
}
