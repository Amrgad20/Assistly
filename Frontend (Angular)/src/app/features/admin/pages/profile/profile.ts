import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

  user: User | null = null;

  name = '';

  email = '';

  editing = false;

  successMessage = '';

  errorMessage = '';

  constructor(
    private auth: AuthService
  ) {

    this.loadProfile();

  }

  loadProfile(): void {

    this.user = this.auth.getCurrentUser();

    if (!this.user) {
      return;
    }

    this.name = this.user.name;

    this.email = this.user.email;

  }

  startEdit(): void {

    this.editing = true;

    this.successMessage = '';

    this.errorMessage = '';

  }

  cancelEdit(): void {

    this.editing = false;

    this.successMessage = '';

    this.errorMessage = '';

    this.loadProfile();

  }

  saveProfile(): void {

    if (!this.user) {
      return;
    }

    const trimmedName = this.name.trim();

    const trimmedEmail = this.email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {

      this.errorMessage =
        'Name and email are required.';

      return;

    }

    if (!this.isValidEmail(trimmedEmail)) {

      this.errorMessage =
        'Please enter a valid email address.';

      return;

    }

    const updatedUser: User = {
      ...this.user,
      name: trimmedName,
      email: trimmedEmail
    };

    this.auth.updateCurrentUser(
      updatedUser
    );

    this.user = updatedUser;

    this.editing = false;

    this.errorMessage = '';

    this.successMessage =
      'Profile updated successfully.';

  }

  get initials(): string {

    if (!this.name.trim()) {
      return 'A';
    }

    return this.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part =>
        part.charAt(0).toUpperCase()
      )
      .join('');

  }

  get roleLabel(): string {

    if (!this.user) {
      return '';
    }

    switch (this.user.role) {

      case 'admin':
        return 'Administrator';

      case 'agent':
        return 'Support Agent';

      case 'customer':
        return 'Customer';

      default:
        return this.user.role;

    }

  }

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  }

}