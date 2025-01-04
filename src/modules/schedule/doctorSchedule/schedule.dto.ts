import { IsNotEmpty } from "class-validator";

export class ScheduleDto {
  @IsNotEmpty({ message: "医生是必填的" })
  doctorId: number;

  @IsNotEmpty({ message: "排班日期是必填的" })
  date: string | Array<Recordable>;

  timePeriod: "MORNING" | "AFTERNOON" | "DAY";
}
