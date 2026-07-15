import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss'
})
export class AdminHome {

  stats = [
    { label: 'Total Tickets', value: 128 },
    { label: 'Open Tickets', value: 34 },
    { label: 'Support Agents', value: 12 },
    { label: 'AI Confidence', value: '96%' }
  ];

}