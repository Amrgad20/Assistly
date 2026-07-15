import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.scss'
})
export class TopNavbar {

  constructor(
    public auth: AuthService
  ) {}

  get user() {
    return this.auth.getCurrentUser();
  }

  get displayName(): string {
    if (!this.user) return '';

    switch (this.user.role) {
      case 'admin':
        return 'Admin';
      case 'agent':
        return 'Support Agent';
      case 'customer':
        return 'Customer';
      default:
        return this.user.name;
    }
  }

  get initials(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

}