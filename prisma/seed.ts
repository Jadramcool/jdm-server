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
import {
  Department,
  Menu,
  OperationLog,
  Role,
  SysConfig,
  User,
} from "./initData";

const prisma = new PrismaClient();

/**
 * 初始化系统配置数据
 */
const initConfigData = async () => {
  // 检查表中是否有数据
  const configCount = await prisma.sysConfig.count();

  if (configCount === 0) {
    // 如果没有数据，插入初始数据
    await prisma.sysConfig.createMany({
      data: SysConfig.sysConfigs,
      skipDuplicates: true,
    });
    console.log("系统配置数据初始化完成");
  } else {
    console.log("系统配置数据已存在，跳过初始化");
  }
};

/**
 * 初始化菜单数据
 */
const initMenus = async () => {
  // 检查表中是否有数据
  const menuCount = await prisma.menu.count();

  if (menuCount === 0) {
    // 如果没有数据，插入初始数据
    await prisma.menu.createMany({
      data: Menu.menus,
      skipDuplicates: true,
    });
    console.log("菜单数据初始化完成");
  } else {
    console.log("菜单数据已存在，跳过初始化");
  }
};

/**
 * 初始化用户数据
 */
const initUsers = async () => {
  // 检查表中是否有数据
  const userCount = await prisma.user.count();

  if (userCount === 0) {
    // 如果没有数据，插入初始数据
    await prisma.user.createMany({
      data: User.users,
      skipDuplicates: true,
    });
    console.log("用户数据初始化完成");
  } else {
    console.log("用户数据已存在，跳过初始化");
  }
};

/**
 * 初始化角色数据
 */
const initRoles = async () => {
  // 检查表中是否有数据
  const roleCount = await prisma.role.count();

  if (roleCount === 0) {
    // 如果没有数据，插入初始数据
    await prisma.role.createMany({
      data: Role.roles,
      skipDuplicates: true,
    });
    console.log("角色数据初始化完成");
  } else {
    console.log("角色数据已存在，跳过初始化");
  }
};

/**
 * 为管理员分配全部权限
 */
const initAdminPermissions = async () => {
  // 检查管理员是否已经有角色分配
  const adminUserRole = await prisma.userRole.findFirst({
    where: {
      userId: 1, // 管理员用户ID
      roleId: 1, // 管理员角色ID
    },
  });

  if (!adminUserRole) {
    // 为管理员分配管理员角色
    await prisma.userRole.create({
      data: {
        userId: 1,
        roleId: 1,
      },
    });
    console.log("管理员角色分配完成");
  } else {
    console.log("管理员角色已存在，跳过分配");
  }

  // 检查管理员角色是否已经有菜单权限
  const adminRoleMenuCount = await prisma.roleMenu.count({
    where: {
      roleId: 1, // 管理员角色ID
    },
  });

  if (adminRoleMenuCount === 0) {
    // 获取所有菜单ID
    const allMenus = await prisma.menu.findMany({
      select: { id: true },
    });

    // 为管理员角色分配所有菜单权限
    const roleMenuData = allMenus.map((menu) => ({
      roleId: 1,
      menuId: menu.id,
    }));

    await prisma.roleMenu.createMany({
      data: roleMenuData,
      skipDuplicates: true,
    });
    console.log(`管理员权限分配完成，共分配 ${allMenus.length} 个菜单权限`);
  } else {
    console.log("管理员权限已存在，跳过分配");
  }
};

/**
 * 初始化部门数据
 */
const initDepartments = async () => {
  // 检查是否已经有部门数据
  const departmentCount = await prisma.department.count();

  if (departmentCount === 0) {
    // 如果没有数据，插入初始部门数据
    await prisma.department.createMany({
      data: Department.departments,
      skipDuplicates: true,
    });
    console.log("部门数据初始化完成");
  } else {
    console.log("部门数据已存在，跳过初始化");
  }
};

/**
 * 初始化操作日志数据
 */
const initOperationLogs = async () => {
  // 检查表中是否有数据
  const operationLogCount = await prisma.operationLog.count();

  if (operationLogCount === 0) {
    // 如果没有数据，插入初始数据
    await prisma.operationLog.createMany({
      data: OperationLog.operationLogInitData,
      skipDuplicates: true,
    });
    console.log("操作日志数据初始化完成");
  } else {
    console.log("操作日志数据已存在，跳过初始化");
  }
};

const main = async () => {
  console.log("开始初始化数据库数据...");
  await initConfigData();
  await initRoles();
  await initUsers();
  await initMenus();
  await initDepartments();
  await initAdminPermissions();
  await initOperationLogs();
  console.log("数据库数据初始化完成！");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
