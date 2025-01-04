import { ContainerModule, interfaces } from "inversify";
import { MedicalRecord } from "./medicalRecord/controller";
import { MedicalRecordService } from "./medicalRecord/services";

const medicalRecordContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 病例表
     */
    bind<MedicalRecord>(MedicalRecord).toSelf();
    bind<MedicalRecordService>(MedicalRecordService).toSelf();
  }
);

export { medicalRecordContainer };
