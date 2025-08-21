# 部门管理模块

## 概述

部门管理模块提供了完整的多层级部门管理功能，支持部门的创建、更新、删除、查询，以及用户和角色的分配管理。

## 功能特性

### 🏢 多层级部门管理
- 支持无限层级的部门树形结构
- 自动计算部门层级
- 防止循环引用
- 支持部门排序

### 👥 用户管理
- 用户可以分配到多个部门
- 支持设置主部门
- 支持职位设置
- 批量用户分配
- 用户部门历史记录

### 🔐 角色管理
- 角色可以绑定到部门
- 支持自动分配角色给部门用户
- 灵活的权限控制

### 🔍 查询功能
- 部门名称和编码搜索
- 分页查询
- 树形结构查询
- 部门成员统计
- 部门详情查询

## 数据模型

### Department（部门表）
```sql
- id: 部门ID
- name: 部门名称
- code: 部门编码（唯一）
- description: 部门描述
- parentId: 父部门ID
- managerId: 部门负责人ID
- level: 部门层级
- sortOrder: 排序
- status: 部门状态（ACTIVE/INACTIVE/ARCHIVED）
- createdTime: 创建时间
- updatedTime: 更新时间
- deletedTime: 删除时间
- isDeleted: 是否删除
```

### UserDepartment（用户部门关联表）
```sql
- id: 关联ID
- userId: 用户ID
- departmentId: 部门ID
- isMain: 是否主部门
- position: 职位
- assignedAt: 分配时间
- leftAt: 离开时间
- isActive: 是否激活
```

### RoleDepartment（角色部门关联表）
```sql
- id: 关联ID
- roleId: 角色ID
- departmentId: 部门ID
- autoAssign: 是否自动分配
- defaultPosition: 默认职位
- assignedAt: 分配时间
```

## API 接口

### 部门管理

#### 创建部门
```http
POST /system/department/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "技术部",
  "code": "TECH001",
  "description": "负责技术研发工作",
  "parentId": 1,
  "managerId": 1,
  "sortOrder": 1,
  "status": "ACTIVE"
}
```

#### 更新部门
```http
PUT /system/department/update
Content-Type: application/json
Authorization: Bearer <token>

{
  "id": 1,
  "name": "技术研发部",
  "description": "负责技术研发和创新工作"
}
```

#### 获取部门列表
```http
GET /system/department/list?page=1&pageSize=10&name=技术&status=ACTIVE
Authorization: Bearer <token>
```

#### 获取部门树
```http
GET /system/department/tree?parentId=1
Authorization: Bearer <token>
```

#### 获取部门详情
```http
GET /system/department/detail/1
Authorization: Bearer <token>
```

#### 删除部门
```http
DELETE /system/department/delete/1
Authorization: Bearer <token>
```

### 用户管理

#### 分配用户到部门
```http
POST /system/department/assign-user
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": 1,
  "departmentId": 1,
  "isMain": true,
  "position": "高级工程师"
}
```

#### 批量分配用户
```http
POST /system/department/batch-assign-users
Content-Type: application/json
Authorization: Bearer <token>

{
  "userIds": [1, 2, 3],
  "departmentId": 1,
  "defaultPosition": "普通员工"
}
```

#### 移除用户
```http
DELETE /system/department/remove-user
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": 1,
  "departmentId": 1
}
```

#### 获取部门成员
```http
GET /system/department/members/1?includeInactive=false
Authorization: Bearer <token>
```

### 角色管理

#### 分配角色到部门
```http
POST /system/department/assign-role
Content-Type: application/json
Authorization: Bearer <token>

{
  "roleId": 1,
  "departmentId": 1,
  "autoAssign": true,
  "defaultPosition": "普通员工"
}
```

#### 移除角色
```http
DELETE /system/department/remove-role
Content-Type: application/json
Authorization: Bearer <token>

{
  "roleId": 1,
  "departmentId": 1
}
```

### 查询功能

#### 搜索部门
```http
GET /system/department/search?keyword=技术&limit=10
Authorization: Bearer <token>
```

#### 获取统计信息
```http
GET /system/department/stats?departmentId=1
Authorization: Bearer <token>
```

## 使用示例

### 1. 创建部门层级结构

```javascript
// 创建根部门
const rootDept = await departmentService.createDepartment({
  name: '总公司',
  code: 'ROOT',
  description: '公司总部'
});

// 创建子部门
const techDept = await departmentService.createDepartment({
  name: '技术部',
  code: 'TECH',
  description: '技术研发部门',
  parentId: rootDept.id
});

// 创建孙部门
const frontendDept = await departmentService.createDepartment({
  name: '前端组',
  code: 'FRONTEND',
  description: '前端开发组',
  parentId: techDept.id
});
```

### 2. 用户部门分配

```javascript
// 分配用户到部门
await departmentService.assignUserToDepartment({
  userId: 1,
  departmentId: techDept.id,
  isMain: true,
  position: '技术总监'
});

// 批量分配用户
await departmentService.batchAssignUsersToDepartment({
  userIds: [2, 3, 4],
  departmentId: frontendDept.id,
  defaultPosition: '前端工程师'
});
```

### 3. 角色自动分配

```javascript
// 分配角色到部门，并自动分配给部门用户
await departmentService.assignRoleToDepartment({
  roleId: 1, // 开发者角色
  departmentId: techDept.id,
  autoAssign: true,
  defaultPosition: '开发工程师'
});
```

### 4. 查询部门信息

```javascript
// 获取部门树
const tree = await departmentService.getDepartmentTree();

// 获取部门详情
const detail = await departmentService.getDepartmentDetail(techDept.id);

// 搜索部门
const results = await departmentService.searchDepartmentsByName('技术');

// 获取统计信息
const stats = await departmentService.getDepartmentStats();
```

## 注意事项

### 1. 部门删除限制
- 有子部门的部门不能删除
- 有用户的部门不能删除
- 删除采用软删除方式

### 2. 循环引用检查
- 系统会自动检查并防止部门层级循环引用
- 更新父部门时会进行循环检查

### 3. 用户主部门
- 每个用户只能有一个主部门
- 设置新主部门时会自动取消原主部门标记

### 4. 角色自动分配
- 启用自动分配的角色会自动分配给部门内所有用户
- 新用户加入部门时也会自动获得相关角色

## 性能优化

### 1. 数据库索引
- 部门编码索引
- 父部门ID索引
- 用户部门关联索引
- 角色部门关联索引

### 2. 查询优化
- 使用Prisma的关联查询
- 分页查询避免大量数据加载
- 树形查询使用递归优化

### 3. 缓存策略
- 部门树结构可以考虑缓存
- 部门统计信息可以定期更新缓存

## 扩展建议

### 1. 部门权限
- 可以扩展部门级别的权限控制
- 支持部门数据隔离

### 2. 部门审批
- 添加部门变更审批流程
- 用户部门调动审批

### 3. 部门报表
- 部门人员统计报表
- 部门层级分析
- 部门变更历史

### 4. 集成功能
- 与考勤系统集成
- 与薪资系统集成
- 与项目管理系统集成

## 错误处理

模块提供了完善的错误处理机制：

- 参数验证错误
- 业务逻辑错误
- 数据库约束错误
- 权限验证错误

所有错误都会返回明确的错误信息，便于前端处理和用户理解。