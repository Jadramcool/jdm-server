import { ContainerModule, interfaces } from "inversify";
import { DoctorSchedule } from "./doctorSchedule/controller";
import { DoctorScheduleService } from "./doctorSchedule/services";

const scheduleContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 医生排班表
     */
    bind<DoctorSchedule>(DoctorSchedule).toSelf();
    bind<DoctorScheduleService>(DoctorScheduleService).toSelf();
  }
);

export { scheduleContainer };
