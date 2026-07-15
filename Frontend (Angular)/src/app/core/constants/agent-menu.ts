import { MenuItem } from '../models/menu-item';

export const AGENT_MENU: MenuItem[] = [

  { title:'Dashboard', route:'/support', icon:'layout-dashboard' },

  { title:'Live Conversations', route:'/support/live-conversations', icon:'messages-square' },

  { title:'Assigned Tickets', route:'/support/tickets', icon:'ticket' },

  { title:'Customers', route:'/support/customers', icon:'users' },

  { title:'Profile', route:'/support/profile', icon:'user' },

  { title:'Logout', route:'/logout', icon:'log-out' }

];