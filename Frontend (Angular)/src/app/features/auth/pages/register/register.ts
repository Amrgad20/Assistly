import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  name = '';

  email = '';

  password = '';

  confirmPassword = '';

  hidePassword = true;

  hideConfirmPassword = true;

  loading = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async register(): Promise<void> {

    this.errorMessage = '';

    this.successMessage = '';

    const name = this.name.trim();

    const email = this.email
      .trim()
      .toLowerCase();

    if (
      !name ||
      !email ||
      !this.password ||
      !this.confirmPassword
    ) {

      this.errorMessage =
        'Please complete all required fields.';

      return;

    }

    if (!this.isValidEmail(email)) {

      this.errorMessage =
        'Please enter a valid email address.';

      return;

    }

    if (this.password.length < 8) {

      this.errorMessage =
        'Password must be at least 8 characters.';

      return;

    }

    if (this.password !== this.confirmPassword) {

      this.errorMessage =
        'Passwords do not match.';

      return;

    }

    this.loading = true;

    const result = await this.auth.registerCustomer(
      name,
      email,
      this.password
    );

    this.loading = false;

    if (!result.success) {

      this.errorMessage =
        result.message;

      return;

    }

    this.successMessage =
      'Account created successfully. Redirecting to login...';

    setTimeout(() => {

      this.router.navigate(
        ['/login'],
        {
          queryParams: {
            email
          }
        }
      );

    }, 900);

  }

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  }

}
