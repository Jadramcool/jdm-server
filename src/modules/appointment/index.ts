import { ContainerModule, interfaces } from "inversify";
import { Appointment } from "./appointment/controller";
import { AppointmentService } from "./appointment/services";

const appointmentContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 患者挂号表
     */
    bind<Appointment>(Appointment).toSelf();
    bind<AppointmentService>(AppointmentService).toSelf();
  }
);

export { appointmentContainer };
