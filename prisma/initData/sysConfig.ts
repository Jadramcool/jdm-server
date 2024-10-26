/*
 * @Author: jdm
 * @Date: 2024-09-04 15:25:50
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-04 15:54:17
 * @FilePath: \APP\prisma\initData\sysConfig.ts
 * @Description:
 *
 */
import { Prisma } from "@prisma/client";

export const sysConfig: Prisma.SysConfigCreateManyInput[] = [
  {
    name: "isInit", // 是否初始化
    value: false,
    description:
      "数据库是否经过初始化操作，如果经过初始化，则不再执行初始化操作",
  },
];
