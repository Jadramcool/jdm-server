import { injectable } from "inversify";

@injectable()
export class UtilService {
  // 解析查询参数
  public parseQueryParams(req: any, withUser: boolean = true): any {
    const { query, user = {} } = req;
    const parsedQuery: any = {};
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        try {
          parsedQuery[key] = JSON.parse(query[key]);
        } catch (e) {
          // 如果解析失败，保留原始值
          parsedQuery[key] = query[key];
        }
      }
    }
    if (withUser) {
      parsedQuery.user = user;
    }
    return parsedQuery;
  }
}
