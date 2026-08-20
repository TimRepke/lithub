import { RouteRecordRaw } from "vue-router";

const routeBaseName = "ds-cdrmap-orig";

export default {
  name: routeBaseName,
  path: "cdrmap_2023",
  component: () => import("./ContainerView.vue"),
  meta: { title: "Carbon Dioxide Removal Map 2023 — Literature Hub" },
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
