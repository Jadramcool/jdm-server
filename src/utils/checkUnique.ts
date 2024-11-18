import { PrismaDB } from "../db";
/**
 * @description: 检测唯一性
 * @param {PrismaDB} db
 * @param {string} table 表名
 * @param {string} key 字段名
 * @param {string} name 传值
 * @return {*}
 */
export const checkUnique = async (
  db: PrismaDB, // 数据库实例
  table: string, // 表名
  key: string, // 字段名
  name: string // 传值
) => {
  console.log("🚀 ~ key:", key);

  console.log("🚀 ~ name:", name);

  const existing = await db.prisma[table].findFirst({
    where: { [key]: name },
  });
  console.log("🚀 ~ existing:", existing);

  return !!existing;
};
