/*
 * @Author: jdm
 * @Date: 2024-09-04 11:21:12
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-04 16:40:03
 * @FilePath: \APP\prisma\seed.ts
 * @Description:
 *
 */
import { PrismaClient } from "@prisma/client";
import { Permission, SysConfig } from "./initData";

const prisma = new PrismaClient();

// 首先初始化配置表
const initConfigData = async () => {
  // 检查表中是否有数据
  const configCount = await prisma.sysConfig.count();

  if (configCount === 0) {
    // 如果没有数据，插入初始数据
    await prisma.sysConfig.createMany({
      data: SysConfig.sysConfig,
      skipDuplicates: true,
    });
  }
};

const initPermissions = async () => {
  // 检查是否已经初始化过了
  const isInit = await prisma.sysConfig.findFirst({
    where: {
      name: "isInit",
    },
  });

  if (isInit && !isInit.value) {
    // 如果没有数据，插入初始数据
    await prisma.permission.createMany({
      data: Permission.permissions,
      skipDuplicates: true,
    });
    await prisma.sysConfig.update({
      where: {
        id: isInit.id,
      },
      data: {
        value: true,
      },
    });
  }
};

const initAdmin = async () => {
  // 检查是否已经初始化过了
  const isHasAdmin = await prisma.user.findFirst({
    where: {
      name: "admin",
    },
  });
  if (!isHasAdmin) {
    // 如果没有数据，插入初始数据
    await prisma.user.create({
      data: {
        username: "admin",
        password: "123456..",
      },
    });
  }
};

const main = async () => {
  await initConfigData();
  await initPermissions();
  await initAdmin();
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
