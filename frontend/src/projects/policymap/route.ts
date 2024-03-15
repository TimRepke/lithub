import { RouteRecordRaw } from "vue-router";

const routeBaseName = "ds-policymap";

export default {
  name: routeBaseName,
  path: "policymap",
  component: () => import("./ContainerView.vue"),
  children: [
    {
      name: `${routeBaseName}-explore`,
      path: "",
      alias: ["", "explore"],
      component: () => import("./ExplorerView.vue")
    },
    {
      name: `${routeBaseName}-info`,
      path: "info",
      component: () => import("./InfoView.vue")
    },
  ],
} as RouteRecordRaw;
