import { MenuItem } from '../models/menu-item';

export const ADMIN_MENU: MenuItem[] = [

  {
    title: 'Dashboard',
    route: '/admin',
    icon: 'layout-dashboard'
  },

  {
    title: 'Conversations',
    route: '/admin/conversations',
    icon: 'messages-square'
  },

  {
    title: 'Tickets',
    route: '/admin/tickets',
    icon: 'ticket'
  },

  {
    title: 'Customers',
    route: '/admin/customers',
    icon: 'users'
  },

  {
    title: 'Support Agents',
    route: '/admin/support-agents',
    icon: 'users'
  },

  {
    title: 'Knowledge Base',
    route: '/admin/knowledge-base',
    icon: 'book-open'
  },

  {
    title: 'Settings',
    route: '/admin/settings',
    icon: 'settings'
  },

  {
    title: 'Profile',
    route: '/admin/profile',
    icon: 'user'
  },

  {
    title: 'Logout',
    route: '/logout',
    icon: 'log-out'
  }

];
