import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHashHistory } from "vue-router";

import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";

import "./style.scss";
import App from "./App.vue";
import LandingView from "./views/LandingView.vue";

import { default as policyMapRoute } from "@/projects/policymap/route.ts";
import { default as carbonPricingMapRoute } from "@/projects/carbonpricing/route.ts";

// set up font awesome
library.add(fas);
library.add(fab);
library.add(far);

const pinia = createPinia();
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { name: "landing", path: "/", component: LandingView },
    {
      name: "about",
      path: "/about",
      component: () => import("./views/AboutView.vue"),
    },
    {
      name: "privacy",
      path: "/privacy",
      component: () => import("./views/PrivacyView.vue"),
    },
    {
      path: "/project",
      component: () => import("@/views/ProjectContainer.vue"),
      children: [
        //
        policyMapRoute,
        carbonPricingMapRoute,
      ],
    },
  ],
});

createApp(App) //
  .use(router) //
  .use(pinia) //
  .component("font-awesome-icon", FontAwesomeIcon)
  .mount("#app");
