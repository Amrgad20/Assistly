import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class Analytics {

  stats = [
    { label: 'Total Tickets', value: 128 },
    { label: 'Resolved Tickets', value: 96 },
    { label: 'Avg Response Time', value: '4 min' },
    { label: 'Customer Satisfaction', value: '92%' }
  ];

}