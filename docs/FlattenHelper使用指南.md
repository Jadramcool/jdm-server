# FlattenHelper 使用指南

## 概述

`FlattenHelper` 是一个专门用于处理 Prisma 多对多关系数据扁平化的工具类。它解决了 Prisma 在多对多关系查询中无法直接跳过中间表获取关联数据的问题。

## 问题背景

在 Prisma 中，多对多关系通过中间表实现。例如：

```prisma
model NavigationGroup {
  id          Int    @id @default(autoincrement())
  name        String
  navigations NavigationGroupNavigation[]
}

model Navigation {
  id     Int    @id @default(autoincrement())
  name   String
  path   String
  groups NavigationGroupNavigation[]
}

model NavigationGroupNavigation {
  navigationId Int
  groupId      Int
  sortOrder    Int?
  navigation   Navigation      @relation(fields: [navigationId], references: [id])
  group        NavigationGroup @relation(fields: [groupId], references: [id])
  
  @@id([navigationId, groupId])
}
```

当查询 `NavigationGroup` 并包含 `navigations` 时，返回的数据结构是：

```typescript
{
  id: 1,
  name: "主导航",
  navigations: [
    {
      sortOrder: 1,
      navigation: {  // 嵌套在中间表中
        id: 1,
        name: "首页",
        path: "/home"
      }
    }
  ]
}
```

而我们期望的扁平化结构是：

```typescript
{
  id: 1,
  name: "主导航",
  navigations: [
    {
      id: 1,
      name: "首页",
      path: "/home",
      sortOrder: 1  // 可选：保留中间表字段
    }
  ]
}
```

## 核心功能

### 1. 通用扁平化方法

```typescript
import { FlattenHelper } from '@/utils';

const flattened = FlattenHelper.flattenManyToMany(data, {
  relationField: 'navigations',  // 关系字段名
  targetField: 'navigation',     // 目标字段名
  keepFields: ['sortOrder']      // 保留的中间表字段（可选）
});
```

### 2. 导航组专用方法

```typescript
const flattened = FlattenHelper.flattenNavigationGroup(data, {
  keepSortOrder: true,           // 是否保留排序字段
  newFieldName: 'navigations'    // 新字段名
});
```

## 在服务中的使用

### NavigationGroupService 示例

```typescript
import { FlattenHelper } from '@/utils';

export class NavigationGroupService {
  async getNavigationGroupList(config: ReqListConfig): Promise<Jres> {
    try {
      // ... 查询逻辑 ...
      
      const resp = await PaginationHelper.executePagedQuery(
        this.PrismaDB.prisma.navigationGroup,
        sqlFilters,
        {
          showPagination,
          page,
          pageSize,
          orderBy: [{ createdTime: "asc" }],
          include: {
            navigations: {
              select: {
                navigation: true,
                sortOrder: true  // 包含排序字段
              }
            }
          }
        }
      );

      // 扁平化处理
      if (options?.with_navigation && resp.data) {
        resp.data = FlattenHelper.flattenNavigationGroup(resp.data, {
          keepSortOrder: true,
          newFieldName: 'navigations'
        });
      }

      return {
        data: resp,
        code: 200,
        message: "获取导航组列表成功"
      };
    } catch (error) {
      // 错误处理
    }
  }
}
```

## API 参考

### FlattenHelper.flattenManyToMany()

**参数：**
- `data: T | T[]` - 要处理的数据（单个对象或数组）
- `config: FlattenConfig` - 扁平化配置

**配置选项：**
```typescript
interface FlattenConfig {
  relationField: string;              // 关系字段名（如 'navigations'）
  targetField: string;                // 目标字段名（如 'navigation'）
  outputField?: string;               // 输出字段名（默认与relationField相同）
  keepIntermediateFields?: string[];  // 要保留的中间表字段
  filter?: (relation: any) => boolean; // 过滤函数
  sortBy?: string;                    // 排序字段
}
```

### FlattenHelper.flattenNavigationGroup()

**参数：**
- `data: T | T[]` - 导航组数据（单个对象或数组）
- `options` - 扁平化选项

**选项：**
```typescript
interface NavigationGroupOptions {
  keepSortOrder?: boolean;  // 是否保留排序字段
  newFieldName?: string;    // 新字段名（默认为'navigations'）
}
```

## 使用场景

### 1. 导航组与导航的多对多关系
```typescript
// 原始数据结构
const navigationGroups = [
  {
    id: 1,
    name: '主导航',
    navigations: [
      {
        sortOrder: 1,
        navigation: {
          id: 101,
          name: '首页',
          path: '/home'
        }
      }
    ]
  }
];

// 使用专用方法
const result = FlattenHelper.flattenNavigationGroup(navigationGroups, {
  keepSortOrder: true,
  newFieldName: 'navigations'
});

// 结果
[
  {
    id: 1,
    name: '主导航',
    navigations: [
      {
        id: 101,
        name: '首页',
        path: '/home',
        sortOrder: 1
      }
    ]
  }
]
```

### 2. 用户角色的多对多关系
```typescript
// 使用通用方法
const result = FlattenHelper.flattenManyToMany(users, {
  relationField: 'userRoles',
  targetField: 'role',
  outputField: 'roles',
  keepIntermediateFields: ['assignedAt', 'isActive']
});
```

## 注意事项

1. **数据结构要求**：确保输入数据符合Prisma多对多关系的标准结构

2. **字段名称**：relationField和targetField必须与实际数据结构中的字段名一致

3. **性能考虑**：对于大量数据，建议在数据库层面进行优化

4. **类型安全**：建议使用TypeScript以获得更好的类型检查

5. **错误处理**：方法会自动处理null/undefined值，无需额外检查

6. **过滤功能**：使用filter选项可以在扁平化过程中过滤不需要的数据

7. **排序功能**：使用sortBy选项可以对扁平化后的数据进行排序

## 最佳实践

1. **选择合适的方法**：
   - 通用场景使用 `flattenManyToMany()`
   - 导航组场景使用 `flattenNavigationGroup()`

2. **性能优化**：
   - 在数据库查询时就进行必要的过滤
   - 只保留需要的中间表字段
   - 使用filter选项在扁平化时过滤数据

3. **代码组织**：
   - 将扁平化逻辑封装在service层
   - 使用TypeScript接口定义数据结构
   - 添加适当的错误处理

4. **测试建议**：
   - 测试空数据和null值的处理
   - 验证中间表字段的正确保留
   - 检查过滤和排序功能的正确性

## 总结

`FlattenHelper` 提供了一套完整的解决方案来处理 Prisma 多对多关系的数据扁平化问题。通过合理使用这些工具方法，可以：

- 简化前端数据处理逻辑
- 提供更直观的API响应格式
- 保持数据结构的一致性
- 提高开发效率

建议在项目中统一使用这些方法来处理类似的数据结构问题。