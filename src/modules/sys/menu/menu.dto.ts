import { Transform } from "class-transformer";
import { IsNotEmpty, ValidateIf } from "class-validator";

export class MenuDto {
  id?: number;

  @IsNotEmpty({ message: "菜单名称是必填的" })
  @Transform((role) => role.value.trim())
  name: string;

  @IsNotEmpty({ message: "权限代码是必填的" })
  code: string;

  @ValidateIf((o) => o.type !== "BUTTON")
  @IsNotEmpty({ message: "菜单路径是必填的" })
  path: string;

  @IsNotEmpty({ message: "菜单类型是必填的" })
  type: string;

  layout: string;
  icon: string;
  component: string;
  sort: number;
  pid: number;
  show: boolean;
  description: string;
  order: number;
}
