/*
 * @Author: jdm
 * @Date: 2024-08-21 16:39:01
 * @LastEditors: jdm
 * @LastEditTime: 2024-08-26 15:40:40
 * @FilePath: \APP\config\settings.ts
 * @Description:
 *
 */
const LOG_LEVEL = "debug";
const LOG_FILE_SIZE = "20m";
const LOG_FILE_COUNT = "5";
const LOG_FREQUENCY = "24h";
const LOG_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS";
const LOG_FILE_NAME = "combined";
const LOG_FILE_DIR = "./logs";

export {
  LOG_DATE_FORMAT,
  LOG_FILE_COUNT,
  LOG_FILE_DIR,
  LOG_FILE_NAME,
  LOG_FILE_SIZE,
  LOG_FREQUENCY,
  LOG_LEVEL,
};
