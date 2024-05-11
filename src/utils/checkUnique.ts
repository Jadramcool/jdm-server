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
  db: PrismaDB,
  table: string,
  key: string,
  name: string
) => {
  const existing = await db.prisma[table].findFirst({
    where: { [key]: name },
  });

  if (existing) {
    return true;
  } else {
    return false;
  }
};
