import { FilterHelper } from "@/utils";
import { JWT } from "@jwt/index";
import { BlogCommentStatus, BlogPostStatus, User } from "@prisma/client";
import { inject, injectable } from "inversify";
import { PrismaDB } from "../../../db";

// 数据传输对象接口定义
interface CreatePostData {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  status?: BlogPostStatus;
  isTop?: boolean;
  allowComment?: boolean;
  categoryId?: number;
  tagIds?: number[];
  addTags?: string[]; // 新增标签名称数组
  authorId: number;
}

interface UpdatePostData {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverImage?: string;
  status?: BlogPostStatus;
  isTop?: boolean;
  allowComment?: boolean;
  categoryId?: number;
  tagIds?: number[];
  addTags?: string[]; // 新增标签名称数组
}

// 统一响应格式接口
interface ServiceResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
  errMsg?: string;
}

// 文章查询条件接口
interface PostQueryWhere {
  id?: number | { not: number };
  slug?: string;
  isDeleted: boolean;
  authorId?: number;
}

@injectable()
export class BlogPostService {
  constructor(
    @inject(PrismaDB) private readonly PrismaDB: PrismaDB,
    @inject(JWT) private readonly JWT: JWT
  ) {}

  // ==================== 私有工具方法 ====================

  /**
   * 生成唯一的文章 slug
   * @param title 文章标题
   * @param excludeId 排除的文章ID（用于更新时避免自身冲突）
   * @returns 唯一的 slug
   */
  private async generateUniqueSlug(
    title: string,
    excludeId?: number
  ): Promise<string> {
    // 生成基础 slug：转小写、替换特殊字符、限制长度
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);

    let slug = baseSlug;
    let counter = 1;

    // 循环检查 slug 唯一性，如有冲突则添加数字后缀
    while (true) {
      const existing = await this.PrismaDB.prisma.blogPost.findFirst({
        where: {
          slug,
          isDeleted: false,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * 统一的错误处理方法
   * @param error 错误对象
   * @param operation 操作名称
   * @returns 标准化的错误响应
   */
  private handleError(error: any, operation: string): ServiceResponse {
    console.error(`${operation}失败:`, error);

    // 处理 Prisma 特定错误
    if (error.code === "P2002") {
      return {
        code: 400,
        message: "数据冲突，请检查唯一性约束",
        errMsg: error.message,
      };
    }

    if (error.code === "P2025") {
      return {
        code: 404,
        message: "记录不存在",
        errMsg: error.message,
      };
    }

    return {
      code: 500,
      message: `${operation}失败`,
      errMsg: error instanceof Error ? error.message : "未知错误",
    };
  }

  /**
   * 验证文章存在性和权限
   * @param id 文章ID
   * @param authorId 作者ID（可选，用于权限验证）
   * @returns 验证结果和文章数据
   */
  private async validatePostAccess(
    id: number,
    authorId?: number
  ): Promise<ServiceResponse> {
    const post = await this.PrismaDB.prisma.blogPost.findFirst({
      where: { id, isDeleted: false },
    });

    if (!post) {
      return { code: 404, message: "文章不存在" };
    }

    // 权限检查（如果提供了 authorId）
    if (authorId && post.authorId !== authorId) {
      return { code: 403, message: "无权限操作此文章" };
    }

    return { code: 200, data: post };
  }

  /**
   * 验证关联数据（分类和标签）的有效性
   * @param categoryId 分类ID
   * @param tagIds 标签ID数组
   * @returns 验证结果
   */
  private async validateRelations(
    categoryId?: number,
    tagIds?: number[]
  ): Promise<ServiceResponse> {
    // 验证分类
    if (categoryId) {
      const category = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { id: categoryId, isDeleted: false },
      });
      if (!category) {
        return { code: 400, message: "分类不存在" };
      }
    }

    // 验证标签
    if (tagIds && tagIds.length > 0) {
      const tags = await this.PrismaDB.prisma.blogTag.findMany({
        where: { id: { in: tagIds }, isDeleted: false },
      });
      if (tags.length !== tagIds.length) {
        return { code: 400, message: "部分标签不存在" };
      }
    }

    return { code: 200, message: "验证通过" };
  }

  /**
   * 转换文章数据结构（扁平化标签）
   * @param post 原始文章数据
   * @returns 转换后的文章数据
   */
  private transformPostData(post: any) {
    if (!post) return post;

    return {
      ...post,
      tags: post.tags?.map((tagRelation: any) => tagRelation.tag) || [],
    };
  }

  /**
   * 更新分类和标签的统计数据
   * @param categoryId 分类ID
   * @param tagIds 标签ID数组
   * @param increment 增量（1 或 -1）
   */
  private async updateRelationCounts(
    categoryId?: number,
    tagIds?: number[],
    increment: number = 1
  ): Promise<void> {
    const promises: Promise<any>[] = [];

    // 更新分类文章数量
    if (categoryId) {
      promises.push(
        this.PrismaDB.prisma.blogCategory.update({
          where: { id: categoryId },
          data: { postCount: { increment } },
        })
      );
    }

    // 更新标签使用次数
    if (tagIds && tagIds.length > 0) {
      promises.push(
        this.PrismaDB.prisma.blogTag.updateMany({
          where: { id: { in: tagIds } },
          data: { useCount: { increment } },
        })
      );
    }

    await Promise.all(promises);
  }

  /**
   * 处理新增标签，创建不存在的标签并返回所有标签ID
   * @param addTags 新增标签名称数组
   * @param existingTagIds 已存在的标签ID数组
   * @returns 处理后的所有标签ID数组
   */
  private async processAddTags(
    addTags?: string[],
    existingTagIds?: number[]
  ): Promise<number[]> {
    const allTagIds = [...(existingTagIds || [])];

    if (!addTags || addTags.length === 0) {
      return allTagIds;
    }

    // 过滤掉空字符串和重复项
    const uniqueTagNames = [...new Set(addTags.filter((name) => name.trim()))];

    for (const tagName of uniqueTagNames) {
      const trimmedName = tagName.trim();

      // 检查标签是否已存在
      let existingTag = await this.PrismaDB.prisma.blogTag.findFirst({
        where: {
          name: trimmedName,
          isDeleted: false,
        },
      });

      // 如果标签不存在，则创建新标签
      if (!existingTag) {
        // 生成标签 slug
        const slug = trimmedName
          .toLowerCase()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50);

        // 确保 slug 唯一性
        let uniqueSlug = slug;
        let counter = 1;
        while (true) {
          const existingSlug = await this.PrismaDB.prisma.blogTag.findFirst({
            where: { slug: uniqueSlug, isDeleted: false },
          });
          if (!existingSlug) break;
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        // 创建新标签
        existingTag = await this.PrismaDB.prisma.blogTag.create({
          data: {
            name: trimmedName,
            slug: uniqueSlug,
            color: this.generateRandomColor(), // 生成随机颜色
            useCount: 0,
          },
        });
      }

      // 避免重复添加相同的标签ID
      if (!allTagIds.includes(existingTag.id)) {
        allTagIds.push(existingTag.id);
      }
    }

    return allTagIds;
  }

  /**
   * 生成随机标签颜色
   * @returns 随机颜色值
   */
  private generateRandomColor(): string {
    const colors = [
      "#f56565",
      "#ed8936",
      "#ecc94b",
      "#48bb78",
      "#38b2ac",
      "#4299e1",
      "#667eea",
      "#9f7aea",
      "#ed64a6",
      "#a0aec0",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ==================== 公共业务方法 ====================

  /**
   * 创建博客文章
   * @param data 文章创建数据
   * @returns 创建结果
   */
  async createPost(data: CreatePostData, user: User): Promise<ServiceResponse> {
    console.log("🚀 ~ BlogPostService ~ createPost ~ user:", user);
    console.log("🚀 ~ BlogPostService ~ createPost ~ data:", data);
    try {
      // 1. 处理新增标签，获取所有标签ID
      const allTagIds = await this.processAddTags(data.addTags, data.tagIds);

      // 2. 生成唯一 slug
      const slug = data.slug || (await this.generateUniqueSlug(data.title));

      // 3. 检查 slug 唯一性
      const existingPost = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { slug, isDeleted: false },
      });
      if (existingPost) {
        return { code: 400, message: "文章标识符已存在" };
      }

      // 4. 验证关联数据
      const relationValidation = await this.validateRelations(
        data.categoryId,
        allTagIds
      );
      if (relationValidation.code !== 200) {
        return relationValidation;
      }

      // 5. 设置发布时间
      const publishedAt =
        data.status === BlogPostStatus.PUBLISHED ? new Date() : null;

      // 6. 创建文章
      const includeOptions = {
        author: { select: { id: true, username: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true, color: true },
            },
          },
        },
      };

      const post = await this.PrismaDB.prisma.blogPost.create({
        data: {
          title: data.title,
          slug,
          summary: data.summary,
          content: data.content,
          coverImage: data.coverImage,
          status: data.status || BlogPostStatus.DRAFT,
          isTop: data.isTop || false,
          allowComment: data.allowComment !== false,
          authorId: user.id,
          categoryId: data.categoryId,
          publishedAt,
          tags: allTagIds.length
            ? { create: allTagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: includeOptions,
      });

      // 7. 更新统计数据（仅发布状态）
      if (data.status === BlogPostStatus.PUBLISHED) {
        await this.updateRelationCounts(data.categoryId, allTagIds, 1);
      }

      return {
        code: 200,
        data: this.transformPostData(post),
        message: "文章创建成功",
      };
    } catch (error) {
      return this.handleError(error, "创建文章");
    }
  }

  /**
   * 获取文章列表
   * @param config 查询配置
   * @returns 文章列表和分页信息
   */
  async getPostList(config: ReqListConfig): Promise<ServiceResponse> {
    try {
      const { filters = {}, options, pagination } = config;

      // 文章列表包含选项
      const includeOptions = {
        author: { select: { id: true, username: true, avatar: true } },
        category: {
          select: { id: true, name: true, slug: true, icon: true, color: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      };

      // 文章列表排序选项
      const orderBy = [
        { isTop: "desc" as const },
        { publishedAt: "desc" as const },
        { createdTime: "desc" as const },
      ];

      // 1. 构建查询条件
      const sqlFilters = this.buildListFilters(filters);
      console.log(
        "🚀 ~ BlogPostService ~ getPostList ~ sqlFilters:",
        sqlFilters
      );

      // 2. 查询总数
      const totalRecords = await this.PrismaDB.prisma.blogPost.count({
        where: sqlFilters,
      });

      // 3. 处理分页
      const showPagination = options?.showPagination !== false;
      const page = parseInt(pagination?.page as string) || 1;
      const pageSize = parseInt(pagination?.pageSize as string) || 10;

      // 4. 查询数据
      const queryOptions: any = {
        where: sqlFilters,
        include: includeOptions,
        orderBy,
      };

      if (showPagination) {
        queryOptions.skip = (page - 1) * pageSize;
        queryOptions.take = pageSize;
      }

      const result = await this.PrismaDB.prisma.blogPost.findMany(queryOptions);

      // 5. 转换数据结构
      const transformedPosts = result.map((post) =>
        this.transformPostData(post)
      );

      // 6. 构建响应数据
      const responseData: any = { data: transformedPosts };
      if (showPagination) {
        responseData.pagination = {
          page,
          pageSize,
          totalRecords,
          totalPages: Math.ceil(totalRecords / pageSize),
        };
      }

      return {
        code: 200,
        data: responseData,
        message: "获取文章列表成功",
      };
    } catch (error) {
      return this.handleError(error, "获取文章列表");
    }
  }

  /**
   * 构建列表查询过滤条件
   * @param filters 过滤条件
   * @returns SQL 过滤条件
   */
  private buildListFilters(filters: any): any {
    let sqlFilters: any = { isDeleted: false };

    if (!filters || Object.keys(filters).length === 0) {
      return sqlFilters;
    }

    // 添加基础过滤条件（排除 tagIds，因为需要特殊处理）
    const baseFilters = FilterHelper.addFilterCondition(filters, [
      "id",
      "title",
      "status",
      "categoryId",
      "authorId",
      "isTop",
    ]);
    sqlFilters = { ...sqlFilters, ...baseFilters };

    // 特殊处理 tagIds 过滤（多对多关系）
    if (filters.tagIds) {
      const tagIds = Array.isArray(filters.tagIds)
        ? filters.tagIds
        : [filters.tagIds];
      sqlFilters.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    // 处理 tagIds__in 过滤
    if (filters.tagIds__in) {
      const tagIds = Array.isArray(filters.tagIds__in)
        ? filters.tagIds__in
        : [filters.tagIds__in];
      sqlFilters.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    // 处理时间范围过滤
    const timeFields = ["createdTime", "updatedTime", "publishedAt"];
    timeFields.forEach((timeField) => {
      if (filters[timeField]) {
        sqlFilters[timeField] = {
          gte: new Date(filters[timeField][0]),
          lte: new Date(filters[timeField][1]),
        };
      }
    });

    return sqlFilters;
  }

  /**
   * 根据ID获取文章详情
   * @param id 文章ID
   * @param incrementView 是否增加浏览量
   * @returns 文章详情
   */
  async getPostById(
    id: number,
    incrementView = false
  ): Promise<ServiceResponse> {
    return this.getPostDetail({ id }, incrementView);
  }

  /**
   * 根据slug获取文章详情
   * @param slug 文章slug
   * @param incrementView 是否增加浏览量
   * @returns 文章详情
   */
  async getPostBySlug(
    slug: string,
    incrementView = false
  ): Promise<ServiceResponse> {
    return this.getPostDetail({ slug }, incrementView);
  }

  /**
   * 获取文章详情的通用方法
   * @param where 查询条件
   * @param incrementView 是否增加浏览量
   * @returns 文章详情
   */
  private async getPostDetail(
    where: { id?: number; slug?: string },
    incrementView = false
  ): Promise<ServiceResponse> {
    try {
      // 文章详情包含选项（包含评论）
      const includeOptions = {
        author: { select: { id: true, username: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true, color: true },
            },
          },
        },
        comments: {
          where: { isDeleted: false, status: BlogCommentStatus.APPROVED },
          orderBy: { createdTime: "desc" as const },
          take: 5,
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      };

      // 1. 查询文章
      const post = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { ...where, isDeleted: false },
        include: includeOptions,
      });

      if (!post) {
        return { code: 404, message: "文章不存在" };
      }

      // 2. 增加浏览量（如果需要）
      if (incrementView) {
        await this.PrismaDB.prisma.blogPost.update({
          where: { id: post.id },
          data: { viewCount: { increment: 1 } },
        });
        post.viewCount += 1;
      }

      return {
        code: 200,
        data: this.transformPostData(post),
      };
    } catch (error) {
      return this.handleError(error, "获取文章详情");
    }
  }

  /**
   * 更新博客文章
   * @param id 文章ID
   * @param data 更新数据
   * @param authorId 作者ID（可选，用于权限验证）
   * @returns 更新结果
   */
  async updatePost(id: number, data: UpdatePostData, authorId?: number) {
    try {
      // 1. 处理新增标签，获取所有标签ID
      const allTagIds = await this.processAddTags(data.addTags, data.tagIds);

      // 2. 验证文章存在性和权限
      const validationResult = await this.validatePostUpdatePermission(
        id,
        authorId
      );
      if (validationResult.code !== 200) {
        return validationResult;
      }
      const existingPost = validationResult.data;

      // 3. 验证和处理 slug
      const slugResult = await this.validateAndProcessSlug(
        data,
        existingPost,
        id
      );
      if (slugResult.code !== 200) {
        return slugResult;
      }
      const slug = slugResult.data;

      // 4. 验证关联数据（分类和标签）
      const relationValidation = await this.validateRelationData(
        data,
        allTagIds
      );
      if (relationValidation.code !== 200) {
        return relationValidation;
      }

      // 5. 使用事务执行更新操作
      const result = await this.PrismaDB.prisma.$transaction(async (tx) => {
        // 处理标签关联更新
        if (allTagIds.length > 0 || data.tagIds !== undefined) {
          await this.updatePostTags(tx, id, allTagIds);
        }

        // 构建更新数据
        const updateData = this.buildUpdateData(data, existingPost, slug);

        // 执行文章更新
        return await tx.blogPost.update({
          where: { id },
          data: updateData,
          include: this.getPostIncludeOptions(),
        });
      });

      return {
        code: 200,
        data: result,
        message: "文章更新成功",
      };
    } catch (error) {
      console.error("更新文章失败:", error);
      return this.handleUpdateError(error);
    }
  }

  /**
   * 验证文章更新权限
   * @param id 文章ID
   * @param authorId 作者ID
   * @returns 验证结果
   */
  private async validatePostUpdatePermission(id: number, authorId?: number) {
    const existingPost = await this.PrismaDB.prisma.blogPost.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existingPost) {
      return {
        code: 404,
        message: "文章不存在",
      };
    }

    // 权限检查（如果提供了authorId）
    if (authorId && existingPost.authorId !== authorId) {
      return {
        code: 403,
        message: "无权限修改此文章",
      };
    }

    return {
      code: 200,
      data: existingPost,
    };
  }

  /**
   * 验证和处理文章 slug
   * @param data 更新数据
   * @param existingPost 现有文章
   * @param id 文章ID
   * @returns 处理结果
   */
  private async validateAndProcessSlug(
    data: UpdatePostData,
    existingPost: any,
    id: number
  ) {
    let slug = data.slug;

    // 如果标题改变且未提供新的 slug，则自动生成
    if (data.title && data.title !== existingPost.title && !data.slug) {
      slug = await this.generateUniqueSlug(data.title, id);
    }

    // 检查 slug 唯一性
    if (slug && slug !== existingPost.slug) {
      const existingSlug = await this.PrismaDB.prisma.blogPost.findFirst({
        where: { slug, isDeleted: false, id: { not: id } },
      });
      if (existingSlug) {
        return {
          code: 400,
          message: "文章标识符已存在",
        };
      }
    }

    return {
      code: 200,
      data: slug,
    };
  }

  /**
   * 验证关联数据（分类和标签）
   * @param data 更新数据
   * @param tagIds 处理后的标签ID数组
   * @returns 验证结果
   */
  private async validateRelationData(data: UpdatePostData, tagIds?: number[]) {
    // 验证分类是否存在
    if (data.categoryId) {
      const category = await this.PrismaDB.prisma.blogCategory.findFirst({
        where: { id: data.categoryId, isDeleted: false },
      });
      if (!category) {
        return {
          code: 400,
          message: "分类不存在",
        };
      }
    }

    // 验证标签是否存在
    if (tagIds && tagIds.length > 0) {
      const tags = await this.PrismaDB.prisma.blogTag.findMany({
        where: { id: { in: tagIds }, isDeleted: false },
      });
      if (tags.length !== tagIds.length) {
        return {
          code: 400,
          message: "部分标签不存在",
        };
      }
    }

    return {
      code: 200,
      message: "验证通过",
    };
  }

  /**
   * 更新文章标签关联
   * @param tx 事务对象
   * @param postId 文章ID
   * @param tagIds 标签ID数组
   */
  private async updatePostTags(tx: any, postId: number, tagIds: number[]) {
    // 删除现有标签关联
    await tx.blogPostTag.deleteMany({
      where: { postId },
    });

    // 创建新的标签关联
    if (tagIds.length > 0) {
      await tx.blogPostTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
      });
    }
  }

  /**
   * 构建更新数据对象
   * @param data 原始更新数据
   * @param existingPost 现有文章
   * @param slug 处理后的 slug
   * @returns 构建的更新数据
   */
  private buildUpdateData(
    data: UpdatePostData,
    existingPost: any,
    slug?: string
  ) {
    // 处理发布时间
    let publishedAt = existingPost.publishedAt;
    if (data.status === BlogPostStatus.PUBLISHED && !existingPost.publishedAt) {
      publishedAt = new Date();
    } else if (data.status && data.status !== BlogPostStatus.PUBLISHED) {
      publishedAt = null;
    }

    // 构建基础更新数据
    const updateData: any = {
      ...data,
      slug,
      publishedAt,
    };

    // 移除不应该直接传递给 Prisma 的字段
    delete updateData.tagIds;
    delete updateData.addTags;
    delete updateData.id;

    // 处理分类关联
    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        updateData.category = {
          connect: { id: data.categoryId },
        };
      } else {
        updateData.category = {
          disconnect: true,
        };
      }
      delete updateData.categoryId;
    }

    return updateData;
  }

  /**
   * 获取文章查询的包含选项
   * @returns 包含选项配置
   */
  private getPostIncludeOptions() {
    return {
      author: { select: { id: true, username: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true, color: true },
          },
        },
      },
    };
  }

  /**
   * 处理更新错误
   * @param error 错误对象
   * @returns 错误响应
   */
  private handleUpdateError(error: any) {
    // 根据错误类型返回不同的错误信息
    if (error.code === "P2002") {
      return {
        code: 400,
        message: "数据冲突，请检查唯一性约束",
        errMsg: error.message,
      };
    }

    if (error.code === "P2025") {
      return {
        code: 404,
        message: "记录不存在",
        errMsg: error.message,
      };
    }

    return {
      code: 500,
      message: "更新文章失败",
      errMsg: error instanceof Error ? error.message : "未知错误",
    };
  }

  /**
   * 删除文章（软删除）
   * @param id 文章ID
   * @param authorId 作者ID（可选，用于权限验证）
   * @returns 删除结果
   */
  async deletePost(id: number, authorId?: number): Promise<ServiceResponse> {
    try {
      // 1. 验证文章存在性和权限
      const validation = await this.validatePostAccess(id, authorId);
      if (validation.code !== 200) {
        return validation;
      }
      const existingPost = validation.data;

      // 2. 执行软删除
      await this.PrismaDB.prisma.blogPost.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedTime: new Date(),
        },
      });

      // 3. 更新统计数据（仅已发布文章）
      if (existingPost.status === BlogPostStatus.PUBLISHED) {
        // 获取文章的标签ID
        const tagRelations = await this.PrismaDB.prisma.blogPostTag.findMany({
          where: { postId: id },
          select: { tagId: true },
        });
        const tagIds = tagRelations.map((rel) => rel.tagId);

        await this.updateRelationCounts(existingPost.categoryId, tagIds, -1);
      }

      return {
        code: 200,
        message: "文章删除成功",
      };
    } catch (error) {
      return this.handleError(error, "删除文章");
    }
  }

  /**
   * 切换文章置顶状态
   * @param id 文章ID
   * @param authorId 作者ID（可选，用于权限验证）
   * @returns 切换结果
   */
  async toggleTop(id: number, authorId?: number): Promise<ServiceResponse> {
    try {
      // 1. 验证文章存在性和权限
      const validation = await this.validatePostAccess(id, authorId);
      if (validation.code !== 200) {
        return validation;
      }
      const existingPost = validation.data;

      // 2. 切换置顶状态
      const post = await this.PrismaDB.prisma.blogPost.update({
        where: { id },
        data: { isTop: !existingPost.isTop },
      });

      return {
        code: 200,
        data: { isTop: post.isTop },
        message: `文章${post.isTop ? "置顶" : "取消置顶"}成功`,
      };
    } catch (error) {
      return this.handleError(error, "切换置顶状态");
    }
  }

  /**
   * 切换文章发布状态
   * @param id 文章ID
   * @param authorId 作者ID（可选，用于权限验证）
   * @returns 切换结果
   */
  async togglePublishStatus(
    id: number,
    authorId?: number
  ): Promise<ServiceResponse> {
    try {
      // 1. 验证文章存在性和权限
      const validation = await this.validatePostAccess(id, authorId);
      if (validation.code !== 200) {
        return validation;
      }
      const existingPost = validation.data;

      // 2. 确定新状态和发布时间
      const newStatus =
        existingPost.status === BlogPostStatus.PUBLISHED
          ? BlogPostStatus.DRAFT
          : BlogPostStatus.PUBLISHED;

      const publishedAt =
        newStatus === BlogPostStatus.PUBLISHED
          ? existingPost.publishedAt || new Date()
          : null;

      // 3. 获取文章标签（用于统计更新）
      const tagRelations = await this.PrismaDB.prisma.blogPostTag.findMany({
        where: { postId: id },
        select: { tagId: true },
      });
      const tagIds = tagRelations.map((rel) => rel.tagId);

      // 4. 使用事务更新文章状态和统计数据
      const result = await this.PrismaDB.prisma.$transaction(async (tx) => {
        // 更新文章状态
        const includeOptions = {
          author: { select: { id: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true },
              },
            },
          },
        };

        const post = await tx.blogPost.update({
          where: { id },
          data: {
            status: newStatus,
            publishedAt,
          },
          include: includeOptions,
        });

        // 计算统计数据变化量
        const increment =
          newStatus === BlogPostStatus.PUBLISHED
            ? 1
            : existingPost.status === BlogPostStatus.PUBLISHED
            ? -1
            : 0;

        // 更新统计数据（仅在有变化时）
        if (increment !== 0) {
          await this.updateRelationCounts(
            existingPost.categoryId,
            tagIds,
            increment
          );
        }

        return post;
      });

      return {
        code: 200,
        data: this.transformPostData(result),
        message: `文章${
          newStatus === BlogPostStatus.PUBLISHED ? "发布" : "取消发布"
        }成功`,
      };
    } catch (error) {
      return this.handleError(error, "切换发布状态");
    }
  }

  /**
   * 获取文章统计信息
   * @returns 统计信息
   */
  async getPostStats(): Promise<ServiceResponse> {
    try {
      // 并行查询各种状态的文章数量和统计数据
      const [
        totalCount,
        publishedCount,
        draftCount,
        archivedCount,
        totalViews,
        totalLikes,
      ] = await Promise.all([
        this.PrismaDB.prisma.blogPost.count({ where: { isDeleted: false } }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: BlogPostStatus.PUBLISHED },
        }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: BlogPostStatus.DRAFT },
        }),
        this.PrismaDB.prisma.blogPost.count({
          where: { isDeleted: false, status: BlogPostStatus.ARCHIVED },
        }),
        this.PrismaDB.prisma.blogPost.aggregate({
          where: { isDeleted: false },
          _sum: { viewCount: true },
        }),
        this.PrismaDB.prisma.blogPost.aggregate({
          where: { isDeleted: false },
          _sum: { likeCount: true },
        }),
      ]);

      return {
        code: 200,
        data: {
          total: totalCount,
          published: publishedCount,
          draft: draftCount,
          archived: archivedCount,
          totalViews: totalViews._sum.viewCount || 0,
          totalLikes: totalLikes._sum.likeCount || 0,
        },
        message: "获取统计信息成功",
      };
    } catch (error) {
      return this.handleError(error, "获取文章统计信息");
    }
  }
}
