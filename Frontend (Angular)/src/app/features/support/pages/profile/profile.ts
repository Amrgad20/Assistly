import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile {

  agent = {

    name: 'Ahmed Support',

    email: 'agent@assistly.com',

    phone: '+20 100 123 4567',

    department: 'Customer Support',

    role: 'Support Agent'

  };

}