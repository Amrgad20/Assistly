import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

  customer = {
    name: '',
    email: '',
    phone: 'Not provided'
  };

  constructor(
    auth: AuthService
  ) {

    const user = auth.getCurrentUser();

    if (user?.role === 'customer') {
      this.customer = {
        name: user.name,
        email: user.email,
        phone: 'Not provided'
      };
    }

  }

}
