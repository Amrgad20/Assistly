import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SupportTicketToolbar } from './components/support-ticket-toolbar/support-ticket-toolbar';
import { SupportTicketList } from './components/support-ticket-list/support-ticket-list';

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [
    CommonModule,
    SupportTicketToolbar,
    SupportTicketList
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss'
})
export class Tickets {

  search = '';

}