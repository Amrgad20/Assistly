import { Injectable, signal } from '@angular/core';

import { Ticket } from '../../../../../core/models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketPageService {

  private search = signal('');

  readonly searchText = this.search.asReadonly();

  private formOpen = signal(false);

  readonly isFormOpen = this.formOpen.asReadonly();

  private editingTicket = signal<Ticket | null>(null);

  readonly currentTicket = this.editingTicket.asReadonly();

  setSearch(value: string) {

    this.search.set(value);

  }

  openForm() {

    this.editingTicket.set(null);

    this.formOpen.set(true);

  }

  startEdit(ticket: Ticket) {

    this.editingTicket.set(ticket);

    this.formOpen.set(true);

  }

  closeForm() {

    this.formOpen.set(false);

    this.editingTicket.set(null);

  }

  get isEditMode() {

    return this.editingTicket() !== null;

  }

}