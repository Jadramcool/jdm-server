/*
 * @Author: jdm
 * @Date: 2024-09-05 17:04:15
 * @LastEditors: jdm
 * @LastEditTime: 2024-09-06 10:32:39
 * @FilePath: \APP\config\generate-docs.ts
 * @Description:  https://soonerorlater-newbest.github.io/service/nodejs/apidoc.html
 *
 */
import apidoc from "apidoc";
import path from "path";

export const generateDocs = () => {
  const options = {
    src: [
      path.join(__dirname, "../src/modules/user"),
      path.join(__dirname, "../src/modules/sys/permission"),
    ],
    dest: path.join(__dirname, "../doc/"),
  };

  const result = apidoc.createDoc({
    src: options.src,
    dest: options.dest,
  });

  if (result === false) {
    console.error("Failed to generate API documentation");
  } else {
    console.log("API documentation generated successfully");
  }
};
