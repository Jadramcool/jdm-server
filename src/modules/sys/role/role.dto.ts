import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class RoleDto {
  @IsNotEmpty({ message: "角色名是必填的" })
  @Transform((role) => role.value.trim())
  name: string;

  @IsNotEmpty({ message: "角色代码是必填的" })
  code: string;
}
