import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MenuItem } from '../../../core/models/menu-item';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  @Input() appName = 'Assistly';

  @Input() items: MenuItem[] = [];

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onMenuClick(item: MenuItem) {

    if (item.title === 'Logout') {

      this.auth.logout();

      this.router.navigate(['/login']);

    }

  }

  isDashboard(item: MenuItem): boolean {

    return item.route === '/admin';

  }

}