/**
 * 多对多关系扁平化配置
 */
export interface FlattenConfig {
  /** 关系字段名（如 'navigations'） */
  relationField: string;
  /** 目标字段名（如 'navigation'） */
  targetField: string;
  /** 输出字段名（默认与relationField相同） */
  outputField?: string;
  /** 要保留的中间表字段 */
  keepIntermediateFields?: string[];
  /** 过滤函数 */
  filter?: (relation: any) => boolean;
  /** 排序字段 */
  sortBy?: string;
}

/**
 * 数据扁平化工具类
 */
export class FlattenHelper {
  /**
   * 通用的多对多关系数据扁平化方法
   * @param data 要处理的数据（单个对象或数组）
   * @param config 扁平化配置
   * @returns 扁平化后的数据
   */
  static flattenData<T = any>(data: T | T[], config: FlattenConfig): T | T[] {
    if (!data) return data;

    const {
      relationField,
      targetField,
      outputField = relationField,
      keepIntermediateFields = [],
      filter,
      sortBy,
    } = config;

    /**
     * 处理单个对象的扁平化
     * @param item 要处理的对象
     * @returns 扁平化后的对象
     */
    const processItem = (item: any): any => {
      if (!item || typeof item !== "object") return item;

      const result = { ...item };

      // 检查是否存在关系字段
      if (result[relationField] && Array.isArray(result[relationField])) {
        let relationData = result[relationField];

        // 应用过滤器
        if (filter) {
          relationData = relationData.filter(filter);
        }

        // 提取目标字段数据
        const flattenedData = relationData
          .map((relation: any) => {
            if (!relation || typeof relation !== "object") return relation;

            // 获取目标对象
            const targetObject = relation[targetField];
            if (!targetObject) return null;

            // 如果需要保留中间表字段，则合并
            if (keepIntermediateFields.length > 0) {
              const intermediateData: any = {};
              keepIntermediateFields.forEach((field) => {
                if (relation.hasOwnProperty(field)) {
                  intermediateData[field] = relation[field];
                }
              });

              return {
                ...targetObject,
                ...intermediateData,
              };
            }

            return targetObject;
          })
          .filter(Boolean); // 过滤掉null/undefined值

        // 排序处理
        if (sortBy && flattenedData.length > 0) {
          flattenedData.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (typeof aValue === "number" && typeof bValue === "number") {
              return aValue - bValue;
            }
            return String(aValue).localeCompare(String(bValue));
          });
        }

        // 设置新字段
        result[outputField] = flattenedData;

        // 如果输出字段名与原字段名不同，删除原字段
        if (outputField !== relationField) {
          delete result[relationField];
        }
      }

      return result;
    };

    // 处理数组或单个对象
    if (Array.isArray(data)) {
      return data.map(processItem);
    } else {
      return processItem(data);
    }
  }
}

export default FlattenHelper;

