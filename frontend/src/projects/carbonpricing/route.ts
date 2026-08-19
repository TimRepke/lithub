import { RouteRecordRaw } from "vue-router";

const routeBaseName = "ds-carbonpricing";

export default {
  name: routeBaseName,
  path: "carbonpricing",
  component: () => import("./ContainerView.vue"),
  meta: { title: "Carbon Pricing Map — Literature Hub" },
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
