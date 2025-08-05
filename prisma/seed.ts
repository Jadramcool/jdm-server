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
import { Menu, Role, SysConfig, User } from "./initData";

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
      key: "system.isInit",
    },
  });

  if (isInit && isInit.value === "false") {
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
        value: "true",
      },
    });
  }
};

const initAdmin = async () => {
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
        roleType: "admin",
        password:
          process.env.DEFAULT_PASSWORD ||
          "$2a$10$XhLYUx71gN8lnXBpD33k6Og15FE5ojbzTiK9KnqPupmRhfuAXCJMW",
      },
    });
  }
};

const initUser = async () => {
  await prisma.$transaction(async (tx) => {
    const res = await prisma.user.createMany({
      data: User.users,
      skipDuplicates: true,
    });
    if (res.count) {
      // 使用 Promise.all 并行处理每个用户的角色分配
      await Promise.all(
        User.users.map(async (user) => {
          const roleId = 2;
          const userData = await tx.user.findFirst({
            where: {
              username: user.username,
            },
          });

          if (userData) {
            await tx.userRole.create({
              data: {
                userId: userData.id,
                roleId: roleId,
              },
            });
          }
        })
      );
    }
  });
};

const initRole = async () => {
  // 检查是否已经初始化过了
  const isHasDefaultRole = await prisma.role.findFirst({
    where: {
      code: "ADMIN",
    },
  });
  if (!isHasDefaultRole) {
    // 如果没有数据，插入初始数据
    // const defaultRole = await prisma.role.create({
    //   data: {
    //     code: "DEFAULT",
    //     name: "默认角色",
    //     description: "默认角色，拥有所有权限/菜单",
    //   },
    // });

    await prisma.role.createMany({
      data: Role.roles,
      skipDuplicates: true,
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
          roleId: 1,
        },
      });

      const allMenus = await prisma.menu.findMany();

      await prisma.roleMenu.createMany({
        data: allMenus.map((menu) => ({
          roleId: 1,
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
  await initUser();
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
