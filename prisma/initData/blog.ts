import { PrismaClient, BlogPostStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 博客系统初始化数据
 */
export async function initBlogData() {
  console.log('开始初始化博客系统数据...');

  try {
    // 1. 创建博客配置
    const blogConfigs = [
      {
        key: 'site_title',
        value: 'JDM 博客',
        description: '网站标题',
        category: 'basic'
      },
      {
        key: 'site_description',
        value: '一个基于 Node.js + TypeScript + Prisma 的现代化博客系统',
        description: '网站描述',
        category: 'basic'
      },
      {
        key: 'site_keywords',
        value: 'JDM,博客,Node.js,TypeScript,Prisma,技术分享',
        description: '网站关键词',
        category: 'basic'
      },
      {
        key: 'posts_per_page',
        value: '10',
        description: '每页文章数量',
        category: 'display'
      },
      {
        key: 'comment_need_approval',
        value: 'true',
        description: '评论是否需要审核',
        category: 'comment'
      },
      {
        key: 'allow_guest_comment',
        value: 'true',
        description: '是否允许游客评论',
        category: 'comment'
      },
      {
        key: 'enable_friend_links',
        value: 'true',
        description: '是否启用友情链接',
        category: 'feature'
      }
    ];

    for (const config of blogConfigs) {
      await prisma.blogConfig.upsert({
        where: { key: config.key },
        update: config,
        create: config
      });
    }

    // 2. 创建默认博客分类
    const defaultCategories = [
      {
        name: '技术分享',
        slug: 'tech',
        description: '技术相关的文章分享',
        icon: '💻',
        color: '#3b82f6',
        sortOrder: 1
      },
      {
        name: '生活随笔',
        slug: 'life',
        description: '生活感悟和随笔',
        icon: '📝',
        color: '#10b981',
        sortOrder: 2
      },
      {
        name: '学习笔记',
        slug: 'notes',
        description: '学习过程中的笔记整理',
        icon: '📚',
        color: '#f59e0b',
        sortOrder: 3
      },
      {
        name: '项目展示',
        slug: 'projects',
        description: '个人项目和作品展示',
        icon: '🚀',
        color: '#8b5cf6',
        sortOrder: 4
      }
    ];

    for (const category of defaultCategories) {
      await prisma.blogCategory.upsert({
        where: { slug: category.slug },
        update: category,
        create: category
      });
    }

    // 3. 创建默认博客标签
    const defaultTags = [
      { name: 'JavaScript', slug: 'javascript', color: '#f7df1e' },
      { name: 'TypeScript', slug: 'typescript', color: '#3178c6' },
      { name: 'Node.js', slug: 'nodejs', color: '#339933' },
      { name: 'React', slug: 'react', color: '#61dafb' },
      { name: 'Vue.js', slug: 'vuejs', color: '#4fc08d' },
      { name: 'Prisma', slug: 'prisma', color: '#2d3748' },
      { name: 'MySQL', slug: 'mysql', color: '#4479a1' },
      { name: '前端开发', slug: 'frontend', color: '#ff6b6b' },
      { name: '后端开发', slug: 'backend', color: '#4ecdc4' },
      { name: '全栈开发', slug: 'fullstack', color: '#45b7d1' },
      { name: '教程', slug: 'tutorial', color: '#96ceb4' },
      { name: '经验分享', slug: 'experience', color: '#feca57' }
    ];

    for (const tag of defaultTags) {
      await prisma.blogTag.upsert({
        where: { slug: tag.slug },
        update: tag,
        create: tag
      });
    }

    // 4. 创建示例友情链接
    const defaultFriendLinks = [
      {
        name: 'GitHub',
        url: 'https://github.com',
        description: '全球最大的代码托管平台',
        avatar: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        sortOrder: 1
      },
      {
        name: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        description: 'Web 开发者的最佳资源',
        avatar: 'https://developer.mozilla.org/favicon-48x48.cbbd161b5b0b.png',
        sortOrder: 2
      },
      {
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        description: '程序员问答社区',
        avatar: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon.png',
        sortOrder: 3
      }
    ];

    for (const link of defaultFriendLinks) {
      const existingLink = await prisma.blogFriendLink.findFirst({
        where: { url: link.url }
      });
      
      if (!existingLink) {
        await prisma.blogFriendLink.create({
          data: link
        });
      }
    }

    console.log('✅ 博客系统数据初始化完成');
    console.log(`   - 创建了 ${blogConfigs.length} 个博客配置项`);
    console.log(`   - 创建了 ${defaultCategories.length} 个默认分类`);
    console.log(`   - 创建了 ${defaultTags.length} 个默认标签`);
    console.log(`   - 创建了 ${defaultFriendLinks.length} 个友情链接`);

  } catch (error) {
    console.error('❌ 博客系统数据初始化失败:', error);
    throw error;
  }
}

/**
 * 创建示例博客文章（可选）
 */
export async function createSampleBlogPost() {
  console.log('开始创建示例博客文章...');

  try {
    // 查找第一个博客用户
    const blogUser = await prisma.user.findFirst({
      where: { isBlogUser: true }
    });

    if (!blogUser) {
      console.log('⚠️  未找到博客用户，跳过创建示例文章');
      return;
    }

    // 获取技术分享分类
    const techCategory = await prisma.blogCategory.findFirst({
      where: { slug: 'tech' }
    });

    // 获取一些标签
    const tags = await prisma.blogTag.findMany({
      where: {
        slug: { in: ['typescript', 'nodejs', 'prisma'] }
      }
    });

    const samplePost = {
      title: '欢迎使用 JDM 博客系统',
      slug: 'welcome-to-jdm-blog',
      summary: '这是一篇示例文章，展示了 JDM 博客系统的基本功能和特性。',
      content: `# 欢迎使用 JDM 博客系统

这是一个基于现代技术栈构建的博客系统，具有以下特性：

## 🚀 技术特性

- **TypeScript**: 类型安全的 JavaScript 超集
- **Node.js**: 高性能的 JavaScript 运行时
- **Prisma**: 现代化的数据库 ORM
- **MySQL**: 可靠的关系型数据库
- **Express**: 快速、极简的 Web 框架

## 📝 功能特性

### 内容管理
- ✅ Markdown 编写支持
- ✅ 文章分类和标签
- ✅ 草稿和发布状态管理
- ✅ 文章置顶功能
- ✅ SEO 友好的 URL

### 互动功能
- ✅ 评论系统（支持嵌套回复）
- ✅ 点赞功能
- ✅ 游客评论支持
- ✅ 评论审核机制

### 系统管理
- ✅ 用户权限管理
- ✅ 博客配置管理
- ✅ 友情链接管理
- ✅ 数据统计分析

## 🎯 开始使用

1. **创建文章**: 登录后台，点击"新建文章"开始创作
2. **管理分类**: 在分类管理中创建和编辑文章分类
3. **设置标签**: 为文章添加相关标签，便于读者查找
4. **配置博客**: 在博客设置中自定义网站信息

## 📚 Markdown 语法示例

### 代码块

\`\`\`typescript
interface BlogPost {
  id: number;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}
\`\`\`

### 表格

| 功能 | 状态 | 描述 |
|------|------|------|
| 文章管理 | ✅ | 完整的 CRUD 操作 |
| 评论系统 | ✅ | 支持嵌套回复 |
| 用户管理 | ✅ | 基于角色的权限控制 |

### 引用

> 这是一个现代化的博客系统，专注于提供优秀的写作和阅读体验。

---

感谢使用 JDM 博客系统！如果您有任何问题或建议，欢迎通过评论或其他方式联系我们。`,
      status: BlogPostStatus.PUBLISHED,
      authorId: blogUser.id,
      categoryId: techCategory?.id,
      publishedAt: new Date(),
      allowComment: true
    };

    const createdPost = await prisma.blogPost.create({
      data: samplePost
    });

    // 为文章添加标签
    if (tags.length > 0) {
      const postTags = tags.map(tag => ({
        postId: createdPost.id,
        tagId: tag.id
      }));

      await prisma.blogPostTag.createMany({
        data: postTags
      });
    }

    console.log('✅ 示例博客文章创建完成');
    console.log(`   - 文章标题: ${samplePost.title}`);
    console.log(`   - 文章 ID: ${createdPost.id}`);
    console.log(`   - 关联标签: ${tags.length} 个`);

  } catch (error) {
    console.error('❌ 示例博客文章创建失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initBlogData()
    .then(() => createSampleBlogPost())
    .then(() => {
      console.log('🎉 博客系统初始化完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('初始化失败:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}