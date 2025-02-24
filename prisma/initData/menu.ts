import { Prisma } from "@prisma/client";

// 自定义菜单创建输入
interface CustomMenuCreateInput extends Prisma.MenuCreateInput {
  id: number;
}

export const menus: CustomMenuCreateInput[] = [
  {
    id: 1,
    name: "首页",
    code: "Home",
    type: "MENU",
    pid: null,
    path: "/home",
    redirect: null,
    icon: "fe:home",
    component: "/src/views/home/index.vue",
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: '{"withContentCard": false}',
  },
  {
    id: 2,
    name: "系统管理",
    code: "System",
    type: "MENU",
    pid: null,
    path: "/system",
    redirect: "/system/user",
    icon: "fe:layout",
    component: null,
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 3,
    name: "用户管理",
    code: "User",
    type: "MENU",
    pid: 2,
    path: "/system/user",
    redirect: null,
    icon: "fe:layout",
    component: "/src/views/system/user/index.vue",
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 4,
    name: "菜单管理",
    code: "MenuManager",
    type: "MENU",
    pid: 2,
    path: "/system/menu",
    redirect: null,
    icon: "solar:checklist-broken",
    component: "/src/views/system/menu/index.vue",
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 5,
    name: "角色管理",
    code: "Role",
    type: "MENU",
    pid: 2,
    path: "/system/role",
    redirect: null,
    icon: "solar:user-speak-outline",
    component: "/src/views/system/role/index.vue",
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 6,
    name: "个人中心",
    code: "UserCenter",
    type: "MENU",
    pid: null,
    path: "/user-center",
    redirect: null,
    icon: "solar:user-id-broken",
    component: "/src/views/user-center/index.vue",
    layout: "normal",
    keepAlive: true,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: '{"withContentCard": false}',
  },
  {
    id: 7,
    name: "新增",
    code: "system:user:create",
    type: "BUTTON",
    pid: 3,
    path: null,
    redirect: null,
    icon: null,
    component: null,
    layout: "normal",
    keepAlive: false,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 8,
    name: "公告管理",
    code: "NoticeManager",
    type: "DIRECTORY",
    pid: null,
    path: "/notice",
    redirect: "/notice/notice",
    icon: "material-symbols:signpost-outline",
    component: null,
    layout: "normal",
    keepAlive: false,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 9,
    name: "公告",
    code: "Notice",
    type: "MENU",
    pid: 8,
    path: "/notice/notice",
    redirect: null,
    icon: "iconoir:post",
    component: "/src/views/notice/notice/index.vue",
    layout: "normal",
    keepAlive: false,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: null,
  },
  {
    id: 10,
    name: "待办事项",
    code: "Todo",
    type: "MENU",
    pid: 8,
    path: "/notice/todo",
    redirect: null,
    icon: "vscode-icons:file-type-light-todo",
    component: "/src/views/notice/todo/index.vue",
    layout: "normal",
    keepAlive: false,
    method: null,
    description: null,
    show: true,
    enable: true,
    order: 0,
    extraData: '{"withContentCard": false}',
  },
];
