import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/pages/index.vue"),
    },
    {
      path: "/player",
      component: () => import("@/pages/player.vue"),
    },
    {
      path: "/example",
      component: () => import("@/pages/example-usage.vue"),
    },
  ],
});
