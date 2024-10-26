/*
 * @Author: jdm
 * @Date: 2024-09-04 18:15:26
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-05 14:46:02
 * @FilePath: \APP\src\utils\errInfo\userError.ts
 * @Description:
 *
 */
const userError = {
  login_password_error: {
    zhCN: "密码错误",
    enUS: "Password error",
  },
  login_username_not_exist: {
    zhCN: "用户名不存在",
    enUS: "Username not exist",
  },
  // 用户名已存在
  register_username_exist: {
    zhCN: "用户名已存在",
    enUS: "Username already exist",
  },
};

export default userError;
