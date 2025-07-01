/*
 * @Author: jdm
 * @Date: 2025-01-27 10:00:00
 * @LastEditors: jdm 1051780106@qq.com
 * @LastEditTime: 2025-06-27 13:54:06
 * @FilePath: \jdm-server\src\modules\external\validator.ts
 * @Description: 外部数据模块的数据验证工具
 */

import { CreateU3C3DataDto, UpdateU3C3DataDto, ValidationError } from "./dto";

/**
 * 数据验证工具类
 */
export class ExternalValidator {
  /**
   * 验证创建u3c3数据的输入
   * @param data 要验证的数据
   * @returns 验证错误数组，如果为空则验证通过
   */
  static validateCreateU3C3Data(data: CreateU3C3DataDto): ValidationError[] {
    const errors: ValidationError[] = [];

    // 验证必填字段
    if (
      !data.title ||
      typeof data.title !== "string" ||
      data.title.trim().length === 0
    ) {
      errors.push({
        field: "title",
        message: "标题不能为空",
        value: data.title,
      });
    } else if (data.title.length > 500) {
      errors.push({
        field: "title",
        message: "标题长度不能超过500个字符",
        value: data.title,
      });
    }

    // 验证可选字段
    if (data.type && typeof data.type !== "string") {
      errors.push({
        field: "type",
        message: "类型必须是字符串",
        value: data.type,
      });
    }

    if (data.content && typeof data.content !== "string") {
      errors.push({
        field: "content",
        message: "内容必须是字符串",
        value: data.content,
      });
    }

    if (data.url && typeof data.url !== "string") {
      errors.push({
        field: "url",
        message: "URL必须是字符串",
        value: data.url,
      });
    } else if (data.url && !this.isValidUrl(data.url)) {
      errors.push({
        field: "url",
        message: "URL格式不正确",
        value: data.url,
      });
    }

    if (
      data.size !== undefined &&
      (typeof data.size !== "number" || data.size < 0)
    ) {
      errors.push({
        field: "size",
        message: "大小必须是非负数",
        value: data.size,
      });
    }

    if (data.date && !this.isValidDate(data.date)) {
      errors.push({
        field: "date",
        message: "日期格式不正确",
        value: data.date,
      });
    }

    if (
      data.status !== undefined &&
      (typeof data.status !== "number" || !Number.isInteger(data.status))
    ) {
      errors.push({
        field: "status",
        message: "状态必须是整数",
        value: data.status,
      });
    }

    if (
      data.priority !== undefined &&
      (typeof data.priority !== "number" || !Number.isInteger(data.priority))
    ) {
      errors.push({
        field: "priority",
        message: "优先级必须是整数",
        value: data.priority,
      });
    }

    // 验证字符串长度限制
    const stringFields = [
      "type",
      "description",
      "tags",
      "category",
      "author",
      "source",
    ];
    stringFields.forEach((field) => {
      const value = data[field as keyof CreateU3C3DataDto];
      if (value && typeof value === "string" && value.length > 255) {
        errors.push({
          field,
          message: `${field}长度不能超过255个字符`,
          value,
        });
      }
    });

    return errors;
  }

  /**
   * 验证更新u3c3数据的输入
   * @param data 要验证的数据
   * @returns 验证错误数组，如果为空则验证通过
   */
  static validateUpdateU3C3Data(data: UpdateU3C3DataDto): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查是否至少有一个字段要更新
    const hasValidField = Object.keys(data).some((key) => {
      const value = data[key as keyof UpdateU3C3DataDto];
      return value !== undefined && value !== null && value !== "";
    });

    if (!hasValidField) {
      errors.push({
        field: "general",
        message: "至少需要提供一个要更新的字段",
        value: data,
      });
      return errors;
    }

    // 验证字段类型和格式（与创建验证类似，但所有字段都是可选的）
    if (data.title !== undefined) {
      if (typeof data.title !== "string" || data.title.trim().length === 0) {
        errors.push({
          field: "title",
          message: "标题不能为空",
          value: data.title,
        });
      } else if (data.title.length > 500) {
        errors.push({
          field: "title",
          message: "标题长度不能超过500个字符",
          value: data.title,
        });
      }
    }

    if (data.type !== undefined && typeof data.type !== "string") {
      errors.push({
        field: "type",
        message: "类型必须是字符串",
        value: data.type,
      });
    }

    if (data.content !== undefined && typeof data.content !== "string") {
      errors.push({
        field: "content",
        message: "内容必须是字符串",
        value: data.content,
      });
    }

    if (data.url !== undefined) {
      if (typeof data.url !== "string") {
        errors.push({
          field: "url",
          message: "URL必须是字符串",
          value: data.url,
        });
      } else if (data.url && !this.isValidUrl(data.url)) {
        errors.push({
          field: "url",
          message: "URL格式不正确",
          value: data.url,
        });
      }
    }

    if (
      data.size !== undefined &&
      (typeof data.size !== "number" || data.size < 0)
    ) {
      errors.push({
        field: "size",
        message: "大小必须是非负数",
        value: data.size,
      });
    }

    if (data.date !== undefined && !this.isValidDate(data.date)) {
      errors.push({
        field: "date",
        message: "日期格式不正确",
        value: data.date,
      });
    }

    if (
      data.status !== undefined &&
      (typeof data.status !== "number" || !Number.isInteger(data.status))
    ) {
      errors.push({
        field: "status",
        message: "状态必须是整数",
        value: data.status,
      });
    }

    if (
      data.priority !== undefined &&
      (typeof data.priority !== "number" || !Number.isInteger(data.priority))
    ) {
      errors.push({
        field: "priority",
        message: "优先级必须是整数",
        value: data.priority,
      });
    }

    // 验证字符串长度限制
    const stringFields = [
      "type",
      "description",
      "tags",
      "category",
      "author",
      "source",
    ];
    stringFields.forEach((field) => {
      const value = data[field as keyof UpdateU3C3DataDto];
      if (
        value !== undefined &&
        typeof value === "string" &&
        value.length > 255
      ) {
        errors.push({
          field,
          message: `${field}长度不能超过255个字符`,
          value,
        });
      }
    });

    return errors;
  }

  /**
   * 验证ID参数
   * @param id 要验证的ID
   * @returns 验证错误数组，如果为空则验证通过
   */
  static validateId(id: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (id === undefined || id === null) {
      errors.push({
        field: "id",
        message: "ID不能为空",
        value: id,
      });
    } else if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      errors.push({
        field: "id",
        message: "ID必须是正整数",
        value: id,
      });
    }

    return errors;
  }

  /**
   * 验证URL格式
   * @param url 要验证的URL
   * @returns 是否为有效URL
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // 如果不是完整URL，检查是否是相对路径
      return /^(\/|\.\/|\.\.\/|[a-zA-Z0-9])/i.test(url);
    }
  }

  /**
   * 验证日期格式
   * @param date 要验证的日期
   * @returns 是否为有效日期
   */
  private static isValidDate(date: string | Date): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }

    if (typeof date === "string") {
      // 检查常见的日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}:\d{2})?$/;
      if (!dateRegex.test(date)) {
        return false;
      }

      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }

    return false;
  }

  /**
   * 清理和标准化输入数据
   * @param data 要清理的数据
   * @returns 清理后的数据
   */
  static sanitizeData(data: any): any {
    const sanitized = { ...data };

    // 清理字符串字段
    Object.keys(sanitized).forEach((key) => {
      const value = sanitized[key];
      if (typeof value === "string") {
        // 去除首尾空格
        sanitized[key] = value.trim();
        // 如果清理后为空字符串，设为undefined
        if (sanitized[key] === "") {
          sanitized[key] = undefined;
        }
      }
    });

    return sanitized;
  }
}
