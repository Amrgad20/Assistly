import { Component } from '@angular/core';
import {
  ActivatedRoute,
  RouterOutlet
} from '@angular/router';

import { Sidebar } from '../../shared/ui/sidebar/sidebar';
import { TopNavbar } from '../../shared/ui/top-navbar/top-navbar';

import { MenuItem } from '../../core/models/menu-item';

import { AuthService } from '../../core/services/auth.service';

import { ADMIN_MENU } from '../../core/constants/admin-menu';
import { AGENT_MENU } from '../../core/constants/agent-menu';
import { CUSTOMER_MENU } from '../../core/constants/customer-menu';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    TopNavbar
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout {

  appName = 'Assistly';

  menuItems: MenuItem[] = [];

  usesContainedScrolling = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute
  ) {

    const role = this.auth.getCurrentUser()?.role;

    switch (role) {

      case 'admin':
        this.menuItems = ADMIN_MENU;
        break;

      case 'agent':
        this.menuItems = AGENT_MENU;
        break;

      case 'customer':
        this.menuItems = CUSTOMER_MENU;
        break;

      default:
        this.menuItems = [];
        break;

    }

  }

  updateContentScrollMode(): void {

    let activeRoute = this.route;

    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }

    this.usesContainedScrolling =
      activeRoute.snapshot.data[
        'contentScroll'
      ] === 'contained';

  }

}
