import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  email = '';

  password = '';

  remember = false;

  hidePassword = true;

  loading = false;

  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async login(): Promise<void> {

    this.errorMessage = '';

    const email =
      this.email.trim();

    if (!email || !this.password) {

      this.errorMessage =
        'Please enter your email and password.';

      return;

    }

    this.loading = true;

    const user = await this.auth.login(
      email,
      this.password,
      this.remember
    );

    this.loading = false;

    if (!user) {

      this.errorMessage =
        'Invalid email or password.';

      return;

    }

    switch (user.role) {

      case 'admin':

        this.router.navigate([
          '/admin'
        ]);

        break;

      case 'agent':

        this.router.navigate([
          '/support'
        ]);

        break;

      case 'customer':

        this.router.navigate([
          '/customer/chat'
        ]);

        break;

    }

  }

}
