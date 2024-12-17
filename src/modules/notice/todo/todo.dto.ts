import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class TodoDto {
  @IsNotEmpty({ message: "待办事项标题是必填的" })
  @Transform((role) => role.value.trim())
  title: string;

  pid?: number;
}
