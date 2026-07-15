import { MenuItem } from '../models/menu-item';

export const CUSTOMER_MENU: MenuItem[] = [

  {
    title: 'New Chat',
    route: '/customer/chat',
    icon: 'message-circle-plus'
  },

  {
    title: 'My Tickets',
    route: '/customer/tickets',
    icon: 'ticket'
  },

  {
    title: 'Profile',
    route: '/customer/profile',
    icon: 'user'
  },

  {
    title: 'Logout',
    route: '/logout',
    icon: 'log-out'
  }

];