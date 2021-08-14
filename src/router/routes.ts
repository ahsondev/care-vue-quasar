import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { name: 'home', path: '', component: () => import('pages/Index.vue') },
    ],
  },
  {
    path: '/login',
    component: () => import('layouts/PlainLayout.vue'),
    children: [
      { name: 'login', path: '', component: () => import('pages/Login.vue') },
    ],
    meta: {
      allowAnonymous: true,
    },
  },
  {
    path: '/payrolls',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'payrolls',
        path: '',
        component: () => import('pages/Payrolls.vue'),
      },
    ],
  },
  {
    path: '/invoices',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'invoices',
        path: '',
        component: () => import('pages/Invoices.vue'),
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'settings',
        path: '',
        component: () => import('pages/Settings.vue'),
      },
    ],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('layouts/PlainLayout.vue'),
    children: [{ path: '', component: () => import('pages/Error404.vue') }],
  },
];

export default routes;
