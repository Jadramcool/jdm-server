/*
 * @Author: jdm
 * @Date: 2024-08-21 10:29:39
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-03 15:59:21
 * @FilePath: \APP\src\middleware\logger.ts
 * @Description:
 *
 */
import expressWinston from "express-winston";
import winston from "winston";
import "winston-daily-rotate-file";
import {
  LOG_DATE_FORMAT,
  LOG_FILE_COUNT,
  LOG_FILE_DIR,
  LOG_FILE_NAME,
  LOG_FILE_SIZE,
  LOG_FREQUENCY,
  LOG_LEVEL,
} from "../../config/settings";

// 自定义格式化器
const myFormat = winston.format.printf((info) => {
  const { timestamp, label, level, message, meta } = info;

  const levelUp = level.toUpperCase();

  const url: string = meta?.req?.url ? meta.req.url : "";
  const method: string = meta?.req?.method ? meta.req.method : "";
  const status: number = meta?.res?.statusCode ? meta.res.statusCode : 0;
  const responseTime: number = meta?.responseTime ? meta.responseTime : 0;
  const query: string | null = meta?.req?.query
    ? JSON.stringify(meta.req.query)
    : null;

  const metaData = `url: ${url}, method: ${method}, query: ${query}, status: ${status}, responseTime: ${responseTime}`;

  // 用户信息
  let user: string;
  if (meta.user) {
    const { id, username, name, phone } = meta.user;
    user = `id=${id}, username=${username}, name=${name}, phone=${phone}`;
  }

  return `${timestamp} [${label}] [${levelUp}]: ${metaData} | message: ${message} | user: ${user}`;
});

// 控制台传输配置
const consoleTransport = new winston.transports.Console({
  level: LOG_LEVEL,
  handleExceptions: true,
  format: winston.format.combine(
    winston.format.label({ label: "ExpressApp" }),
    winston.format.timestamp({ format: LOG_DATE_FORMAT }),
    myFormat
  ),
});

// 日志文件传输配置
const fileTransport = new winston.transports.DailyRotateFile({
  level: LOG_LEVEL,
  dirname: LOG_FILE_DIR,
  filename: LOG_FILE_NAME,
  datePattern: "YYYY-MM-DD",
  format: winston.format.combine(
    winston.format.label({ label: "ExpressApp" }),
    winston.format.timestamp({ format: LOG_DATE_FORMAT }),
    myFormat
  ),
  handleExceptions: true,
  handleRejections: true,
  frequency: LOG_FREQUENCY,
  zippedArchive: true,
  maxSize: LOG_FILE_SIZE,
  maxFiles: LOG_FILE_COUNT,
});

// 创建winston logger实例
const LOGGER = winston.createLogger({
  transports: [consoleTransport, fileTransport],
  exceptionHandlers: [consoleTransport, fileTransport],
  rejectionHandlers: [consoleTransport, fileTransport],
  exitOnError: true,
});

// express-winston 中间件
export const logger = expressWinston.logger({
  winstonInstance: LOGGER, // 使用已经配置好的 LOGGER 实例
  expressFormat: false, // 使用自定义格式
  colorize: false,
  meta: true,
  dynamicMeta: (req, res) => {
    // 获取动态相关信息
    const dynamicMeta = {
      user: req.user ? req.user : null,
    };
    // console.log("Dynamic Meta:", dynamicMeta); // 调试输出
    return dynamicMeta;
  },
});
