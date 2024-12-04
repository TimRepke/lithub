import { RouteRecordRaw } from "vue-router";

const routeBaseName = "ds-eppi";

export default {
  name: routeBaseName,
  path: "eppi",
  component: () => import("./ContainerView.vue"),
  children: [
    {
      name: `${routeBaseName}-explore`,
      path: "",
      alias: ["", "explore"],
      component: () => import("./ExplorerView.vue"),
    },
    {
      name: `${routeBaseName}-info`,
      path: "info",
      component: () => import("./InfoView.vue"),
    },
  ],
} as RouteRecordRaw;
