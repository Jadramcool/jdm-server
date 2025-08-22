# 用户-部门关系重构说明

## 概述

本次重构将用户和部门的关系从**多对多**改为**一对一**，即：
- 一个用户只能属于一个部门
- 一个部门可以有多个用户

## 主要变更

### 1. 数据库Schema变更

#### 删除的表
- `user_department` - 用户部门关联中间表

#### User表新增字段
- `department_id` - 部门ID（外键）
- `position` - 职位
- `joined_at` - 加入部门时间

#### 关系变更
- User模型：`departments: UserDepartment[]` → `department: Department?`
- Department模型：`users: UserDepartment[]` → `users: User[]`

### 2. 服务层变更

#### DepartmentService类修改的方法

1. **assignUserToDepartment()** - 分配用户到部门
   - 移除了`isMain`参数（不再需要主部门概念）
   - 直接更新User表的`departmentId`字段
   - 简化了逻辑，不再需要处理中间表

2. **batchAssignUsersToDepartment()** - 批量分配用户到部门
   - 移除了`isMain`参数
   - 调用更新后的`assignUserToDepartment`方法

3. **removeUserFromDepartment()** - 从部门移除用户
   - 将用户的`departmentId`设置为`null`
   - 清空`position`和`joinedAt`字段

4. **getDepartmentMembers()** - 获取部门成员
   - 直接查询User表中`departmentId`匹配的用户
   - 移除了`isMain`、`isActive`等字段

5. **getDepartmentDetail()** - 获取部门详情
   - 更新了用户查询逻辑
   - 移除了中间表相关的include

6. **getDepartmentStats()** - 获取部门统计
   - 更新了成员统计逻辑，直接统计User表

### 3. DTO变更

#### AssignUserToDepartmentDto
- 移除了`isMain`字段

#### DepartmentMemberDto
- 移除了`isMain`、`assignedAt`、`isActive`字段
- 新增了`joinedAt`字段

## 迁移说明

### 数据库迁移
```bash
npx prisma migrate dev --name user_department_one_to_one
```

### 数据迁移注意事项

如果现有数据库中有用户分配到多个部门的情况，需要手动处理：

1. **保留主部门**：如果用户有多个部门，保留标记为`isMain=true`的部门
2. **选择最新部门**：如果没有主部门标记，选择最近分配的部门
3. **数据清理**：删除`user_department`表中的冗余记录

### 示例迁移SQL
```sql
-- 将主部门信息迁移到User表
UPDATE user u 
INNER JOIN user_department ud ON u.id = ud.user_id 
SET u.department_id = ud.department_id,
    u.position = ud.position,
    u.joined_at = ud.assigned_at
WHERE ud.is_main = true AND ud.is_active = true;

-- 对于没有主部门的用户，选择最新的部门
UPDATE user u 
INNER JOIN (
    SELECT user_id, department_id, position, assigned_at,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY assigned_at DESC) as rn
    FROM user_department 
    WHERE is_active = true
) latest ON u.id = latest.user_id
SET u.department_id = latest.department_id,
    u.position = latest.position,
    u.joined_at = latest.assigned_at
WHERE u.department_id IS NULL AND latest.rn = 1;
```

## API影响

### 不变的API
- 所有现有的API端点保持不变
- 请求和响应格式基本保持兼容

### 行为变更
- 用户分配到部门时，如果已有部门会被替换
- 不再支持用户同时属于多个部门
- 移除了主部门的概念

## 优势

1. **简化数据模型**：移除了复杂的中间表
2. **提高查询性能**：减少了JOIN操作
3. **简化业务逻辑**：不再需要处理多部门和主部门逻辑
4. **数据一致性**：避免了用户多部门带来的数据不一致问题

## 注意事项

1. **数据备份**：在执行迁移前务必备份数据库
2. **测试验证**：在生产环境部署前充分测试
3. **前端适配**：前端代码可能需要相应调整
4. **权限系统**：如果权限系统依赖多部门，需要重新设计

## 测试验证

重构完成后，建议进行以下测试：

1. **功能测试**：验证所有部门相关API正常工作
2. **数据完整性测试**：确保数据迁移正确
3. **性能测试**：验证查询性能是否有改善
4. **边界测试**：测试异常情况处理

---

**重构完成时间**：2025年1月13日  
**影响范围**：数据库Schema、服务层、DTO定义  
**向后兼容性**：API接口保持兼容，但业务逻辑有变更