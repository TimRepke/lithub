import { RouteRecordRaw } from "vue-router";

const routeBaseName = "ds-healthmap2024";

export default {
  name: routeBaseName,
  path: "healthmap_2024",
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
