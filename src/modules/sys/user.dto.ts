// dto层用来验证数据
// class-validator用来验证数据
import { IsNotEmpty, IsEmail, IsMobilePhone } from "class-validator";
// class-transformer用来转换数据
import { Transform } from "class-transformer";

export class UserDto {
  @IsNotEmpty({ message: "名称是必填的" })
  @Transform((user) => user.value.trim())
  name: string;

  @IsNotEmpty({ message: "邮箱是必填的" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  email: string;

  @IsNotEmpty({ message: "手机号是必填的" })
  @IsMobilePhone("zh-CN", {}, { message: "手机号格式不正确" })
  phone: string;

  @IsNotEmpty({ message: "密码是必填的" })
  password: string;
}
