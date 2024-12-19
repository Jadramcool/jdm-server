import { ContainerModule, interfaces } from "inversify";
import { Department } from "./department/controller";
import { DepartmentService } from "./department/services";
import { Doctor } from "./doctor/controller";
import { DoctorService } from "./doctor/services";

const hospitalContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 科室管理
     */
    bind<Department>(Department).toSelf();
    bind<DepartmentService>(DepartmentService).toSelf();

    /*
     * 医生管理
     */
    bind<Doctor>(Doctor).toSelf();
    bind<DoctorService>(DoctorService).toSelf();
  }
);

export { hospitalContainer };
