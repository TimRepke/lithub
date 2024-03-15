import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHashHistory } from "vue-router";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";

import "./style.css";
import App from "./App.vue";
import LandingView from "./views/LandingView.vue";

import { default as policyMapRoute } from "@/projects/policymap/route.ts";
import { default as carbonPricingMapRoute } from "@/projects/carbonpricing/route.ts";

const pinia = createPinia();
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { name: "landing", path: "/", component: LandingView },
    {
      name: "about",
      path: "/about",
      component: () => import("./views/AboutView.vue")
    },
    {
      path: "/project",
      component: () => import("@/views/ProjectContainer.vue"),
      children: [
        policyMapRoute,
        carbonPricingMapRoute
      ],
    }
  ],
});

createApp(App)
  .use(router)
  .use(pinia)
  .mount("#app");