import { JWT } from "@jwt/index";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: number;
  sortOrder?: number;
}

interface CategoryQueryParams {
  parentId?: number;
  includeChildren?: boolean;
  includePostCount?: boolean;
}

@injectable()
export class BlogCategoryService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // 生成唯一的 slug
  private async generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: {
          slug,
          isDeleted: false,
          ...(excludeId && { id: { not: excludeId } })
        }
      });
      
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  // 创建分类
  async createCategory(data: CreateCategoryData) {
    try {
      // 生成 slug
      const slug = data.slug || await this.generateUniqueSlug(data.name);
      
      // 检查 slug 是否已存在
      const existingCategory = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { slug, isDeleted: false }
      });
      
      if (existingCategory) {
        return {
          code: 400,
          message: "分类标识符已存在"
        };
      }

      // 检查分类名称是否已存在
      const existingName = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { name: data.name, isDeleted: false }
      });
      
      if (existingName) {
        return {
          code: 400,
          message: "分类名称已存在"
        };
      }

      // 验证父分类是否存在
      if (data.parentId) {
        const parentCategory = await this.PrismaDB.prisma.blogCategory.findFirst({
          where: { id: data.parentId, isDeleted: false }
        });
        if (!parentCategory) {
          return {
            code: 400,
            message: "父分类不存在"
          };
        }
      }

      const category = await this.PrismaDB.prisma.blogCategory.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          icon: data.icon,
          color: data.color,
          parentId: data.parentId,
          sortOrder: data.sortOrder || 0
        },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: { 
            where: { isDeleted: false },
            select: { id: true, name: true, slug: true, postCount: true }
          }
        }
      });

      return {
        code: 200,
        data: category,
        message: "分类创建成功"
      };
    } catch (error) {
      console.error('创建分类失败:', error);
      return {
        code: 500,
        message: "创建分类失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 获取分类列表
  async getCategoryList(params: CategoryQueryParams = {}) {
    try {
      const {
        parentId,
        includeChildren = true,
        includePostCount = true
      } = params;

      const where: any = {
        isDeleted: false
      };

      if (parentId !== undefined) {
        where.parentId = parentId;
      }

      const categories = await this.PrismaDB.prisma.blogCategory.findMany({
        where,
        orderBy: [
          { sortOrder: 'asc' },
          { createdTime: 'asc' }
        ],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          ...(includeChildren && {
            children: {
              where: { isDeleted: false },
              orderBy: [
                { sortOrder: 'asc' },
                { createdTime: 'asc' }
              ],
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                color: true,
                sortOrder: true,
                postCount: includePostCount,
                createdTime: true
              }
            }
          })
        }
      });

      return {
        code: 200,
        data: categories
      };
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return {
        code: 500,
        message: "获取分类列表失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 获取分类树形结构
  async getCategoryTree() {
    try {
      const categories = await this.PrismaDB.prisma.blogCategory.findMany({
        where: { isDeleted: false },
        orderBy: [
          { sortOrder: 'asc' },
          { createdTime: 'asc' }
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
          color: true,
          parentId: true,
          sortOrder: true,
          postCount: true,
          createdTime: true
        }
      });

      // 构建树形结构
      const categoryMap = new Map();
      const rootCategories: any[] = [];

      // 初始化所有分类
      categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });

      // 构建父子关系
      categories.forEach(category => {
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(categoryMap.get(category.id));
          }
        } else {
          rootCategories.push(categoryMap.get(category.id));
        }
      });

      return {
        code: 200,
        data: rootCategories
      };
    } catch (error) {
      console.error('获取分类树失败:', error);
      return {
        code: 500,
        message: "获取分类树失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 根据ID获取分类详情
  async getCategoryById(id: number) {
    try {
      const category = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { id, isDeleted: false },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { isDeleted: false },
            orderBy: [
              { sortOrder: 'asc' },
              { createdTime: 'asc' }
            ],
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              icon: true,
              color: true,
              sortOrder: true,
              postCount: true
            }
          },
          posts: {
            where: { isDeleted: false, status: 'PUBLISHED' },
            orderBy: { publishedAt: 'desc' },
            take: 5,
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              coverImage: true,
              viewCount: true,
              likeCount: true,
              commentCount: true,
              publishedAt: true,
              author: {
                select: { id: true, username: true, avatar: true }
              }
            }
          }
        }
      });

      if (!category) {
        return {
          code: 404,
          message: "分类不存在"
        };
      }

      return {
        code: 200,
        data: category
      };
    } catch (error) {
      console.error('获取分类详情失败:', error);
      return {
        code: 500,
        message: "获取分类详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 根据slug获取分类详情
  async getCategoryBySlug(slug: string) {
    try {
      const category = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { slug, isDeleted: false },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { isDeleted: false },
            orderBy: [
              { sortOrder: 'asc' },
              { createdTime: 'asc' }
            ],
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              icon: true,
              color: true,
              sortOrder: true,
              postCount: true
            }
          },
          posts: {
            where: { isDeleted: false, status: 'PUBLISHED' },
            orderBy: { publishedAt: 'desc' },
            take: 10,
            select: {
              id: true,
              title: true,
              slug: true,
              summary: true,
              coverImage: true,
              viewCount: true,
              likeCount: true,
              commentCount: true,
              publishedAt: true,
              author: {
                select: { id: true, username: true, avatar: true }
              }
            }
          }
        }
      });

      if (!category) {
        return {
          code: 404,
          message: "分类不存在"
        };
      }

      return {
        code: 200,
        data: category
      };
    } catch (error) {
      console.error('获取分类详情失败:', error);
      return {
        code: 500,
        message: "获取分类详情失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 更新分类
  async updateCategory(id: number, data: UpdateCategoryData) {
    try {
      // 检查分类是否存在
      const existingCategory = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { id, isDeleted: false }
      });

      if (!existingCategory) {
        return {
          code: 404,
          message: "分类不存在"
        };
      }

      // 生成新的 slug（如果名称改变了）
      let slug = data.slug;
      if (data.name && data.name !== existingCategory.name && !data.slug) {
        slug = await this.generateUniqueSlug(data.name, id);
      }

      // 检查 slug 是否已存在
      if (slug && slug !== existingCategory.slug) {
        const existingSlug = await this.PrismaDB.prisma.blogCategory.findFirst({
          where: { slug, isDeleted: false, id: { not: id } }
        });
        if (existingSlug) {
          return {
            code: 400,
            message: "分类标识符已存在"
          };
        }
      }

      // 检查分类名称是否已存在
      if (data.name && data.name !== existingCategory.name) {
        const existingName = await this.PrismaDB.prisma.blogCategory.findFirst({
          where: { name: data.name, isDeleted: false, id: { not: id } }
        });
        if (existingName) {
          return {
            code: 400,
            message: "分类名称已存在"
          };
        }
      }

      // 验证父分类是否存在（防止循环引用）
      if (data.parentId !== undefined) {
        if (data.parentId === id) {
          return {
            code: 400,
            message: "不能将自己设为父分类"
          };
        }
        
        if (data.parentId) {
          const parentCategory = await this.PrismaDB.prisma.blogCategory.findFirst({
            where: { id: data.parentId, isDeleted: false }
          });
          if (!parentCategory) {
            return {
              code: 400,
              message: "父分类不存在"
            };
          }

          // 检查是否会形成循环引用
          const isDescendant = await this.isDescendantOf(data.parentId, id);
          if (isDescendant) {
            return {
              code: 400,
              message: "不能将子分类设为父分类"
            };
          }
        }
      }

      const category = await this.PrismaDB.prisma.blogCategory.update({
        where: { id },
        data: {
          ...data,
          slug
        },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              icon: true,
              color: true,
              sortOrder: true,
              postCount: true
            }
          }
        }
      });

      return {
        code: 200,
        data: category,
        message: "分类更新成功"
      };
    } catch (error) {
      console.error('更新分类失败:', error);
      return {
        code: 500,
        message: "更新分类失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 删除分类（软删除）
  async deleteCategory(id: number) {
    try {
      const existingCategory = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { id, isDeleted: false },
        include: {
          children: { where: { isDeleted: false } },
          posts: { where: { isDeleted: false } }
        }
      });

      if (!existingCategory) {
        return {
          code: 404,
          message: "分类不存在"
        };
      }

      // 检查是否有子分类
      if (existingCategory.children.length > 0) {
        return {
          code: 400,
          message: "该分类下还有子分类，无法删除"
        };
      }

      // 检查是否有文章
      if (existingCategory.posts.length > 0) {
        return {
          code: 400,
          message: "该分类下还有文章，无法删除"
        };
      }

      await this.PrismaDB.prisma.blogCategory.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedTime: new Date()
        }
      });

      return {
        code: 200,
        message: "分类删除成功"
      };
    } catch (error) {
      console.error('删除分类失败:', error);
      return {
        code: 500,
        message: "删除分类失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 检查是否为子分类（防止循环引用）
  private async isDescendantOf(parentId: number, childId: number): Promise<boolean> {
    const parent = await this.PrismaDB.prisma.blogCategory.findFirst({
      where: { id: parentId, isDeleted: false },
      select: { parentId: true }
    });

    if (!parent) return false;
    if (parent.parentId === childId) return true;
    if (parent.parentId) {
      return await this.isDescendantOf(parent.parentId, childId);
    }
    return false;
  }

  // 更新分类文章数量
  async updateCategoryPostCount(categoryId: number) {
    try {
      const postCount = await this.PrismaDB.prisma.blogPost.count({
        where: {
          categoryId,
          isDeleted: false,
          status: 'PUBLISHED'
        }
      });

      await this.PrismaDB.prisma.blogCategory.update({
        where: { id: categoryId },
        data: { postCount }
      });

      return {
        code: 200,
        data: { postCount },
        message: "分类文章数量更新成功"
      };
    } catch (error) {
      console.error('更新分类文章数量失败:', error);
      return {
        code: 500,
        message: "更新分类文章数量失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }

  // 获取分类统计信息
  async getCategoryStats() {
    try {
      const [totalCategories, rootCategories, categoriesWithPosts] = await Promise.all([
        this.PrismaDB.prisma.blogCategory.count({ where: { isDeleted: false } }),
        this.PrismaDB.prisma.blogCategory.count({ where: { isDeleted: false, parentId: null } }),
        this.PrismaDB.prisma.blogCategory.count({ where: { isDeleted: false, postCount: { gt: 0 } } })
      ]);

      return {
        code: 200,
        data: {
          totalCategories,
          rootCategories,
          categoriesWithPosts,
          emptyCategories: totalCategories - categoriesWithPosts
        }
      };
    } catch (error) {
      console.error('获取分类统计信息失败:', error);
      return {
        code: 500,
        message: "获取分类统计信息失败",
        errMsg: error instanceof Error ? error.message : "未知错误"
      };
    }
  }
}