import { Routes } from '@angular/router';

import { Login } from './features/auth/pages/login/login';
import { Register } from './features/auth/pages/register/register';
import { ForgotPassword } from './features/auth/pages/forgot-password/forgot-password';

import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';

import { AdminHome } from './features/admin/pages/admin-home/admin-home';
import { Conversations } from './features/admin/pages/conversations/conversations';
import { Tickets } from './features/admin/pages/tickets/tickets';
import { KnowledgeBase } from './features/admin/pages/knowledge-base/knowledge-base';
import { SupportAgents } from './features/admin/pages/support-agents/support-agents';
import { Analytics } from './features/admin/pages/analytics/analytics';
import { Settings } from './features/admin/pages/settings/settings';
import { Profile } from './features/admin/pages/profile/profile';

import { SupportHome } from './features/support/pages/support-home/support-home';
import { Tickets as SupportTickets } from './features/support/pages/tickets/tickets';
import { LiveConversations } from './features/support/pages/live-conversations/live-conversations';
import { Customers } from './features/support/pages/customers/customers';
import { Profile as SupportProfile } from './features/support/pages/profile/profile';

import { CustomerHome } from './features/customer/pages/customer-home/customer-home';
import { Tickets as CustomerTickets } from './features/customer/pages/tickets/tickets';
import { Chat as CustomerChat } from './features/customer/pages/chat/chat';
import { ConversationHistory } from './features/customer/pages/conversation-history/conversation-history';
import { Profile as CustomerProfile } from './features/customer/pages/profile/profile';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import(
        './features/landing/pages/home/home'
      ).then(module => module.Home)
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgotPassword },

  {
    path: 'admin',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      { path: '', component: AdminHome },
      {
        path: 'conversations',
        component: Conversations,
        data: { contentScroll: 'contained' }
      },
      { path: 'tickets', component: Tickets },
      { path: 'customers', component: Customers },
      { path: 'support-agents', component: SupportAgents },
      { path: 'knowledge-base', component: KnowledgeBase },
      { path: 'analytics', component: Analytics },
      { path: 'settings', component: Settings },
      { path: 'profile', component: Profile }
    ]
  },

  {
    path: 'support',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: { role: 'agent' },
    children: [
      { path: '', component: SupportHome },
      { path: 'tickets', component: SupportTickets },
      {
        path: 'live-conversations',
        component: LiveConversations,
        data: { contentScroll: 'contained' }
      },
      { path: 'customers', component: Customers },
      { path: 'profile', component: SupportProfile }
    ]
  },

  {
    path: 'customer',
    component: DashboardLayout,
    canActivate: [authGuard, roleGuard],
    data: { role: 'customer' },
    children: [
      { path: '', component: CustomerHome },
      {
        path: 'chat',
        component: CustomerChat,
        data: { contentScroll: 'contained' }
      },
      { path: 'conversations', component: ConversationHistory },
      { path: 'tickets', component: CustomerTickets },
      { path: 'profile', component: CustomerProfile }
    ]
  },

  { path: '**', redirectTo: '' }

];
