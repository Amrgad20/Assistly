import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DataTable } from '../../../../../../shared/ui/data-table/data-table';

import { TableColumn } from '../../../../../../shared/models/table-column.model';
import { TableAction } from '../../../../../../shared/models/table-action.model';

import { TicketService } from '../../../../../../core/services/ticket.service';

@Component({
  selector: 'app-support-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTable
  ],
  templateUrl: './support-ticket-list.html',
  styleUrl: './support-ticket-list.scss'
})
export class SupportTicketList {

  @Input() search = '';

  selectedTicket: any = null;

  selectedStatus: 'open' | 'pending' | 'resolved' = 'open';

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
      key: 'customer',
      label: 'Customer'
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

  actions: TableAction[] = [
    {
      label: 'Update Status',
      color: 'primary',
      action: 'edit'
    }
  ];

  get rows() {

    const keyword = this.search.toLowerCase().trim();

    const rows = this.tickets
      .getAll();

    if (!keyword) {

      return rows;

    }

    return rows.filter(ticket =>

      ticket.id.toLowerCase().includes(keyword) ||

      ticket.subject.toLowerCase().includes(keyword) ||

      ticket.customer.toLowerCase().includes(keyword) ||

      ticket.priority.toLowerCase().includes(keyword) ||

      ticket.status.toLowerCase().includes(keyword)

    );

  }

  handleAction(event: any) {

    this.selectedTicket = event.row;

    this.selectedStatus = event.row.status;

  }

  closeModal() {

    this.selectedTicket = null;

  }

  saveStatus() {

    if (!this.selectedTicket) return;

    this.tickets.update({

      ...this.selectedTicket,

      status: this.selectedStatus

    });

    this.closeModal();

  }

}
