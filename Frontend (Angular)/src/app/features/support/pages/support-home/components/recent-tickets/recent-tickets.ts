import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '../../../../../../shared/ui/data-table/data-table';

import { TableColumn } from '../../../../../../shared/models/table-column.model';

import { TicketService } from '../../../../../../core/services/ticket.service';

@Component({
  selector: 'app-recent-tickets',
  standalone: true,
  imports: [
    CommonModule,
    DataTable
  ],
  templateUrl: './recent-tickets.html',
  styleUrl: './recent-tickets.scss'
})
export class RecentTickets {

  constructor(
    private tickets: TicketService
  ) {}

  columns: TableColumn[] = [

    {
      key: 'id',
      label: 'Ticket ID'
    },

    {
      key: 'subject',
      label: 'Subject'
    },

    {
      key: 'priority',
      label: 'Priority',
      type: 'badge'
    },

    {
      key: 'status',
      label: 'Status',
      type: 'badge'
    }

  ];

  get rows() {

    return this.tickets
      .getAll()
      .slice(0, 5);

  }

}