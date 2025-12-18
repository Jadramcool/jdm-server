// 部门创建数据类型
export interface DepartmentSeedData {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number | null;
  managerId?: number | null;
  level: number;
  sortOrder: number;
  status: number;
}

/**
 * 部门初始化数据
 * 采用3层级结构组织：总公司 -> 分公司/事业部 -> 部门
 *
 * 结构说明：
 * - level 1: 总公司层级
 * - level 2: 事业部层级
 * - level 3: 具体职能部门层级
 */
export const departments: DepartmentSeedData[] = [
  // ==================== Level 1: 总公司 ====================
  {
    id: 1,
    name: "总公司",
    code: "HQ",
    description: "集团总部",
    parentId: null,
    level: 1,
    sortOrder: 1,
    status: 0, // 0: 正常, 1: 禁用
  },

  // ==================== Level 2: 事业部 ====================
  {
    id: 2,
    name: "技术事业部",
    code: "TECH_DIV",
    description: "负责技术研发和产品开发",
    parentId: 1,
    level: 2,
    sortOrder: 1,
    status: 0,
  },
  {
    id: 3,
    name: "市场事业部",
    code: "MARKET_DIV",
    description: "负责市场营销和销售",
    parentId: 1,
    level: 2,
    sortOrder: 2,
    status: 0,
  },
  {
    id: 4,
    name: "运营事业部",
    code: "OPS_DIV",
    description: "负责运营管理和客户服务",
    parentId: 1,
    level: 2,
    sortOrder: 3,
    status: 0,
  },
  {
    id: 5,
    name: "财务事业部",
    code: "FINANCE_DIV",
    description: "负责财务管理和会计核算",
    parentId: 1,
    level: 2,
    sortOrder: 4,
    status: 0,
  },
  {
    id: 6,
    name: "人力资源事业部",
    code: "HR_DIV",
    description: "负责人力资源管理",
    parentId: 1,
    level: 2,
    sortOrder: 5,
    status: 0,
  },

  // ==================== Level 3: 技术事业部下属部门 ====================
  {
    id: 7,
    name: "前端开发部",
    code: "FRONTEND_DEPT",
    description: "负责前端技术开发",
    parentId: 2,
    level: 3,
    sortOrder: 1,
    status: 0,
  },
  {
    id: 8,
    name: "后端开发部",
    code: "BACKEND_DEPT",
    description: "负责后端技术开发",
    parentId: 2,
    level: 3,
    sortOrder: 2,
    status: 0,
  },
  {
    id: 9,
    name: "移动开发部",
    code: "MOBILE_DEPT",
    description: "负责移动端应用开发",
    parentId: 2,
    level: 3,
    sortOrder: 3,
    status: 0,
  },
  {
    id: 10,
    name: "测试部",
    code: "QA_DEPT",
    description: "负责产品质量测试",
    parentId: 2,
    level: 3,
    sortOrder: 4,
    status: 0,
  },

  // ==================== Level 3: 市场事业部下属部门 ====================
  {
    id: 11,
    name: "市场推广部",
    code: "MARKETING_DEPT",
    description: "负责市场推广和品牌建设",
    parentId: 3,
    level: 3,
    sortOrder: 1,
    status: 0,
  },
  {
    id: 12,
    name: "销售部",
    code: "SALES_DEPT",
    description: "负责产品销售和客户开发",
    parentId: 3,
    level: 3,
    sortOrder: 2,
    status: 0,
  },
  {
    id: 13,
    name: "商务合作部",
    code: "BD_DEPT",
    description: "负责商务合作和渠道拓展",
    parentId: 3,
    level: 3,
    sortOrder: 3,
    status: 0,
  },

  // ==================== Level 3: 运营事业部下属部门 ====================
  {
    id: 14,
    name: "产品运营部",
    code: "PRODUCT_OPS_DEPT",
    description: "负责产品运营和用户增长",
    parentId: 4,
    level: 3,
    sortOrder: 1,
    status: 0,
  },
  {
    id: 15,
    name: "客户服务部",
    code: "CS_DEPT",
    description: "负责客户服务和支持",
    parentId: 4,
    level: 3,
    sortOrder: 2,
    status: 0,
  },
  {
    id: 16,
    name: "数据分析部",
    code: "DATA_DEPT",
    description: "负责数据分析和商业智能",
    parentId: 4,
    level: 3,
    sortOrder: 3,
    status: 0,
  },

  // ==================== Level 3: 财务事业部下属部门 ====================
  {
    id: 17,
    name: "会计部",
    code: "ACCOUNTING_DEPT",
    description: "负责会计核算和财务报表",
    parentId: 5,
    level: 3,
    sortOrder: 1,
    status: 0,
  },
  {
    id: 18,
    name: "财务管理部",
    code: "FINANCE_MGMT_DEPT",
    description: "负责财务规划和资金管理",
    parentId: 5,
    level: 3,
    sortOrder: 2,
    status: 0,
  },

  // ==================== Level 3: 人力资源事业部下属部门 ====================
  {
    id: 19,
    name: "招聘部",
    code: "RECRUITMENT_DEPT",
    description: "负责人才招聘和选拔",
    parentId: 6,
    level: 3,
    sortOrder: 1,
    status: 0,
  },
  {
    id: 20,
    name: "培训发展部",
    code: "TRAINING_DEPT",
    description: "负责员工培训和职业发展",
    parentId: 6,
    level: 3,
    sortOrder: 2,
    status: 0,
  },
];
