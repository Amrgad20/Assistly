import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Button } from '../../../../../../shared/ui/button/button';

import { TicketPageService } from '../../services/ticket-page.service';

@Component({
  selector: 'app-ticket-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Button
  ],
  templateUrl: './ticket-toolbar.html',
  styleUrl: './ticket-toolbar.scss'
})
export class TicketToolbar {

  @Input() mode: 'admin' | 'support' = 'admin';

  search = '';

  constructor(
    private page: TicketPageService
  ) {}

  onSearch(value: string) {

    this.search = value;

    this.page.setSearch(value);

  }

  addTicket() {

    if (this.mode === 'admin') {

      this.page.openForm();

    }

  }

}