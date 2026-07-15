import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketForm } from './components/ticket-form/ticket-form';
import { TicketToolbar } from './components/ticket-toolbar/ticket-toolbar';
import { TicketList } from './components/ticket-list/ticket-list';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    CommonModule,
    TicketToolbar,
    TicketList,
    TicketForm
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.scss'
})
export class Tickets {

}