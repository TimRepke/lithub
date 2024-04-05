import { RouteRecordRaw } from "vue-router";

const routeBaseName = "ds-cdrmap";

export default {
  name: routeBaseName,
  path: "cdrmap",
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
