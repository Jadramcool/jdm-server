/*
 * @Author: jdm
 * @Date: 2024-09-04 11:21:12
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-04 16:40:03
 * @FilePath: \APP\prisma\seed.ts
 * @Description: 数据库初始化脚本，用于向数据库中插入初始数据
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import {
  Department,
  Menu,
  OperationLog,
  Role,
  SysConfig,
  User,
} from "./initData";

const connectionUrl = new URL(
  process.env.DATABASE_URL || "mysql://localhost:3306/test"
);
if (process.env.DATABASE_URL) {
  if (!connectionUrl.searchParams.has("connectionLimit")) {
    connectionUrl.searchParams.set("connectionLimit", "5");
  }
}

const adapter = new PrismaMariaDb(connectionUrl.toString());
const prisma = new PrismaClient({ adapter });

/**
 * 初始化系统配置数据
 *
 * 检查sys_config表是否为空，如果为空则插入初始系统配置数据
 * 系统配置包括站点名称、描述、版权信息等基础配置项
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
 *
 * 检查menu表是否为空，如果为空则插入初始菜单数据
 * 菜单数据定义了系统的导航结构和权限控制点
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
 *
 * 检查user表是否为空，如果为空则插入初始用户数据
 * 默认包含一个管理员账户和一个普通测试账户
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
 *
 * 检查role表是否为空，如果为空则插入初始角色数据
 * 默认包含管理员角色和普通用户角色
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
 *
 * 为默认管理员用户分配管理员角色，并为管理员角色分配所有菜单权限
 * 确保管理员拥有系统的完整访问权限
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
 *
 * 检查department表是否为空，如果为空则插入初始部门数据
 * 部门数据采用3层级结构：总公司 -> 事业部 -> 职能部门
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
 *
 * 检查operation_log表是否为空，如果为空则插入示例操作日志数据
 * 用于演示和测试操作日志功能，包含各种操作类型的示例数据
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

/**
 * 主函数：按依赖顺序初始化所有数据
 *
 * 初始化顺序：
 * 1. 系统配置数据 - 基础配置
 * 2. 角色数据 - 权限基础
 * 3. 用户数据 - 系统用户
 * 4. 菜单数据 - 导航结构
 * 5. 部门数据 - 组织架构
 * 6. 管理员权限 - 权限分配
 * 7. 操作日志 - 示例数据
 */
const main = async () => {
  console.log("开始初始化数据库数据...");

  // 按依赖顺序初始化数据
  await initConfigData(); // 1. 系统配置
  await initRoles(); // 2. 角色数据
  await initUsers(); // 3. 用户数据
  await initMenus(); // 4. 菜单数据
  await initDepartments(); // 5. 部门数据
  await initAdminPermissions(); // 6. 管理员权限
  await initOperationLogs(); // 7. 操作日志

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
