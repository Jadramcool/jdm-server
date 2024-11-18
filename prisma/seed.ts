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
import { Menu, SysConfig } from "./initData";

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

const initMenus = async () => {
  // 检查是否已经初始化过了
  const isInit = await prisma.sysConfig.findFirst({
    where: {
      name: "isInit",
    },
  });

  if (isInit && !isInit.value) {
    // 如果没有数据，插入初始数据
    await prisma.menu.createMany({
      data: Menu.menus,
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
      username: "admin",
    },
  });
  if (!isHasAdmin) {
    // 如果没有数据，插入初始数据
    await prisma.user.create({
      data: {
        username: "admin",
        password:
          "$2a$10$XhLYUx71gN8lnXBpD33k6Og15FE5ojbzTiK9KnqPupmRhfuAXCJMW", // 123456..
      },
    });
  }
};

const initRole = async () => {
  // 检查是否已经初始化过了
  const isHasDefaultRole = await prisma.role.findFirst({
    where: {
      name: "默认角色",
    },
  });
  if (!isHasDefaultRole) {
    // 如果没有数据，插入初始数据
    const defaultRole = await prisma.role.create({
      data: {
        code: "DEFAULT",
        name: "默认角色",
        description: "默认角色，拥有所有权限/菜单",
      },
    });

    // 给admin用户添加默认角色
    const admin = await prisma.user.findFirst({
      where: {
        username: "admin",
      },
    });
    if (admin) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: defaultRole.id,
        },
      });

      const allMenus = await prisma.menu.findMany();

      await prisma.roleMenu.createMany({
        data: allMenus.map((menu) => ({
          roleId: defaultRole.id,
          menuId: menu.id,
        })),
        skipDuplicates: true,
      });
    }
  }
};

const main = async () => {
  await initConfigData();
  await initMenus();
  await initAdmin();
  await initRole();
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
