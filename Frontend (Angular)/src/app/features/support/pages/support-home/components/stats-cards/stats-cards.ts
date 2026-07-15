import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TicketService } from '../../../../../../core/services/ticket.service';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './stats-cards.html',
  styleUrl: './stats-cards.scss'
})
export class StatsCards {

  constructor(
    private tickets: TicketService
  ) {}

  get assignedTickets() {

    return this.tickets.getAll().length;

  }

  get openTickets() {

    return this.tickets
      .getAll()
      .filter(ticket => ticket.status === 'open')
      .length;

  }

  get pendingTickets() {

    return this.tickets
      .getAll()
      .filter(ticket => ticket.status === 'pending')
      .length;

  }

  get resolvedTickets() {

    return this.tickets
      .getAll()
      .filter(ticket => ticket.status === 'resolved')
      .length;

  }

}