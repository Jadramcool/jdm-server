import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class DepartmentDto {
  @IsNotEmpty({ message: "科室名是必填的" })
  @Transform((role) => role.value.trim())
  name: string;

  description?: string;
}
