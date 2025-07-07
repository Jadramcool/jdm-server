import { ContainerModule, interfaces } from "inversify";
import { BlogUserManager } from "./user/controller";
import { BlogUserService } from "./user/services";
import { BlogPostController } from "./post/controller";
import { BlogPostService } from "./post/services";
import { BlogCategoryController } from "./category/controller";
import { BlogCategoryService } from "./category/services";
import { BlogTagController } from "./tag/controller";
import { BlogTagService } from "./tag/services";
import { BlogCommentController } from "./comment/controller";
import { BlogCommentService } from "./comment/services";
import { BlogConfigController } from "./config/controller";
import { BlogConfigService } from "./config/services";
import { BlogFriendLinkController } from "./friendlink/controller";
import { BlogFriendLinkService } from "./friendlink/services";
import { BlogStatsController } from "./stats/controller";
import { BlogStatsService } from "./stats/services";

const BlogContainer = new ContainerModule(
  (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind
  ) => {
    /*
     * 博客用户相关
     */
    bind<BlogUserManager>(BlogUserManager).toSelf();
    bind<BlogUserService>(BlogUserService).toSelf();

    /*
     * 博客文章相关
     */
    bind<BlogPostController>(BlogPostController).toSelf();
    bind<BlogPostService>(BlogPostService).toSelf();

    /*
      * 博客分类相关
      */
     bind<BlogCategoryController>(BlogCategoryController).toSelf();
     bind<BlogCategoryService>(BlogCategoryService).toSelf();

     /*
      * 博客标签相关
      */
     bind<BlogTagController>(BlogTagController).toSelf();
     bind<BlogTagService>(BlogTagService).toSelf();

     /*
       * 博客评论相关
       */
      bind<BlogCommentController>(BlogCommentController).toSelf();
      bind<BlogCommentService>(BlogCommentService).toSelf();

      /*
       * 博客配置相关
       */
      bind<BlogConfigController>(BlogConfigController).toSelf();
      bind<BlogConfigService>(BlogConfigService).toSelf();

      /*
       * 博客友情链接相关
       */
      bind<BlogFriendLinkController>(BlogFriendLinkController).toSelf();
      bind<BlogFriendLinkService>(BlogFriendLinkService).toSelf();

      /*
       * 博客统计相关
       */
      bind<BlogStatsController>(BlogStatsController).toSelf();
      bind<BlogStatsService>(BlogStatsService).toSelf();
  }
);

export { BlogContainer };
