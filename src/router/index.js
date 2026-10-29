import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useCustomerAuthStore } from "../stores/customerAuth.js";

import AdminLayout from "../layouts/AdminLayout.vue";
import CustomerLayout from "../layouts/CustomerLayout.vue";
import LoginView from "../views/admin/LoginView.vue";
import DashboardView from "../views/admin/DashboardView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ==========================================
    // CUSTOMER ROUTES
    // ==========================================
    {
      path: "/",
      component: CustomerLayout,
      children: [
        {
          path: "",
          name: "customer-home",
          component: () => import("../views/customer/HomeView.vue"),
        },
        {
          path: "products/:id",
          name: "customer-product-details",
          component: () => import("../views/customer/ProductDetailsView.vue"),
        },
        {
          path: "cart",
          name: "customer-cart",
          component: () => import("../views/customer/CartView.vue"),
          meta: { requiresCustomerAuth: true },
        },
        {
          path: "orders",
          name: "customer-orders",
          component: () => import("../views/customer/OrdersView.vue"),
          meta: { requiresCustomerAuth: true },
        },
        {
          path: "orders/:id",
          name: "customer-order-details",
          component: () => import("../views/customer/OrderDetailsView.vue"),
          meta: { requiresCustomerAuth: true },
        },
      ],
    },
    {
      path: "/login",
      name: "customer-login",
      component: () => import("../views/customer/LoginView.vue"),
      meta: { customerGuest: true },
    },
    {
      path: "/register",
      name: "customer-register",
      component: () => import("../views/customer/RegisterView.vue"),
      meta: { customerGuest: true },
    },

    // ==========================================
    // ADMIN ROUTES
    // ==========================================
    {
      path: "/admin/login",
      name: "admin-login",
      component: LoginView,
      meta: { guest: true },
    },
    {
      path: "/admin",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "admin-dashboard",
          component: DashboardView,
        },
        {
          path: "products",
          name: "admin-products",
          component: () => import("../views/admin/ProductsView.vue"),
        },
        {
          path: "products/create",
          name: "admin-product-create",
          component: () => import("../views/admin/ProductFormView.vue"),
        },
        {
          path: "products/:id",
          name: "admin-product-details",
          component: () => import("../views/admin/ProductDetailsView.vue"),
        },
        {
          path: "products/:id/edit",
          name: "admin-product-edit",
          component: () => import("../views/admin/ProductEditView.vue"),
        },
        {
          path: "orders",
          name: "admin-orders",
          component: () => import("../views/admin/OrdersView.vue"),
        },
        {
          path: "support-tickets",
          name: "admin-support-tickets",
          component: () => import("../views/admin/SupportTicketsView.vue"),
        },
        {
          path: "users",
          name: "admin-users",
          component: () => import("../views/admin/UsersView.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("../views/NotFoundView.vue"),
    },
  ],
});

router.beforeEach((to) => {
  const adminAuth = useAuthStore();
  const customerAuth = useCustomerAuthStore();

  if (to.path === "/" && adminAuth.token) {
    return { name: "admin-dashboard", replace: true };
  }

  // Admin protected routes
  if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    !adminAuth.token
  ) {
    return { name: "customer-home", replace: true };
  }

  // Admin guest routes
  if (to.meta.guest && adminAuth.token) {
    return { name: "admin-dashboard" };
  }

  // Customer protected routes (for future cart, orders, profile)
  if (
    to.matched.some((record) => record.meta.requiresCustomerAuth) &&
    !customerAuth.token
  ) {
    return { name: "customer-home", replace: true };
  }

  // Customer guest routes
  if (to.meta.customerGuest && customerAuth.token) {
    return { name: "customer-home" };
  }
});

export default router;
