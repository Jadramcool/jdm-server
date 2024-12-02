import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

export class NoticeDto {
  @IsNotEmpty({ message: "公告标题是必填的" })
  @Transform((role) => role.value.trim())
  title: string;

  @IsNotEmpty({ message: "类型是必填的" })
  type: "NOTICE" | "INFO" | "ACTIVITY";
}
