import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.scss'
})
export class CustomerHome {

  stats = [
    { label: 'Open Tickets', value: 2 },
    { label: 'Resolved Tickets', value: 5 },
    { label: 'Active Chats', value: 1 }
  ];

}