/*
 * @Author: jdm
 * @Date: 2025-01-20
 * @Description: 数据库性能监控和缓存管理工具
 */

import { injectable } from "inversify";

// 性能指标接口
export interface PerformanceMetrics {
  queryCount: number;
  totalQueryTime: number;
  averageQueryTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
}

// 慢查询记录
export interface SlowQueryRecord {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any[];
}

@injectable()
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    queryCount: 0,
    totalQueryTime: 0,
    averageQueryTime: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
  };

  private slowQueries: SlowQueryRecord[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1秒
  private readonly MAX_SLOW_QUERIES = 100;

  // 记录查询性能
  recordQuery(duration: number, query: string, params?: any[]): void {
    this.metrics.queryCount++;
    this.metrics.totalQueryTime += duration;
    this.metrics.averageQueryTime = this.metrics.totalQueryTime / this.metrics.queryCount;

    if (duration > this.SLOW_QUERY_THRESHOLD) {
      this.metrics.slowQueries++;
      this.addSlowQuery(query, duration, params);
    }
  }

  // 记录缓存命中
  recordCacheHit(): void {
    this.metrics.cacheHits++;
    this.updateCacheHitRate();
  }

  // 记录缓存未命中
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
    this.updateCacheHitRate();
  }

  // 更新缓存命中率
  private updateCacheHitRate(): void {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;
  }

  // 添加慢查询记录
  private addSlowQuery(query: string, duration: number, params?: any[]): void {
    const record: SlowQueryRecord = {
      query: query.substring(0, 500), // 限制查询长度
      duration,
      timestamp: new Date(),
      params: params?.slice(0, 5), // 限制参数数量
    };

    this.slowQueries.push(record);

    // 保持慢查询记录数量在限制内
    if (this.slowQueries.length > this.MAX_SLOW_QUERIES) {
      this.slowQueries.shift();
    }
  }

  // 获取性能指标
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 获取慢查询记录
  getSlowQueries(): SlowQueryRecord[] {
    return [...this.slowQueries];
  }

  // 重置指标
  resetMetrics(): void {
    this.metrics = {
      queryCount: 0,
      totalQueryTime: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
    };
    this.slowQueries = [];
  }

  // 生成性能报告
  generateReport(): string {
    const report = [
      '=== 数据库性能报告 ===',
      `查询总数: ${this.metrics.queryCount}`,
      `总查询时间: ${this.metrics.totalQueryTime.toFixed(2)}ms`,
      `平均查询时间: ${this.metrics.averageQueryTime.toFixed(2)}ms`,
      `慢查询数量: ${this.metrics.slowQueries}`,
      `缓存命中次数: ${this.metrics.cacheHits}`,
      `缓存未命中次数: ${this.metrics.cacheMisses}`,
      `缓存命中率: ${this.metrics.cacheHitRate.toFixed(2)}%`,
      '',
      '=== 最近慢查询 ===',
    ];

    this.slowQueries.slice(-10).forEach((record, index) => {
      report.push(
        `${index + 1}. [${record.timestamp.toISOString()}] ${record.duration.toFixed(2)}ms`,
        `   查询: ${record.query}`,
        `   参数: ${JSON.stringify(record.params)}`,
        ''
      );
    });

    return report.join('\n');
  }

  // 获取性能建议
  getPerformanceAdvice(): string[] {
    const advice: string[] = [];

    if (this.metrics.averageQueryTime > 500) {
      advice.push('平均查询时间较长，建议检查索引优化');
    }

    if (this.metrics.slowQueries > this.metrics.queryCount * 0.1) {
      advice.push('慢查询比例较高，建议优化SQL语句');
    }

    if (this.metrics.cacheHitRate < 80) {
      advice.push('缓存命中率较低，建议调整缓存策略');
    }

    if (this.metrics.cacheHitRate > 95) {
      advice.push('缓存命中率很高，性能表现良好');
    }

    if (advice.length === 0) {
      advice.push('性能指标正常，继续保持');
    }

    return advice;
  }
}

// Redis缓存管理器（可选）
@injectable()
export class CacheManager {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

  // 设置缓存
  set(key: string, value: any, ttl: number = this.DEFAULT_TTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data: value, expiry });
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // 删除缓存
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存统计
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // 清理过期缓存
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();
export const cacheManager = new CacheManager();

// 定期清理过期缓存
setInterval(() => {
  const cleaned = cacheManager.cleanup();
  if (cleaned > 0) {
    console.log(`清理了 ${cleaned} 个过期缓存项`);
  }
}, 60000); // 每分钟清理一次