import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StatsCards } from './components/stats-cards/stats-cards';
import { RecentTickets } from './components/recent-tickets/recent-tickets';

@Component({
  selector: 'app-support-home',
  standalone: true,
  imports: [
    CommonModule,
    StatsCards,
    RecentTickets
  ],
  templateUrl: './support-home.html',
  styleUrl: './support-home.scss'
})
export class SupportHome {

}