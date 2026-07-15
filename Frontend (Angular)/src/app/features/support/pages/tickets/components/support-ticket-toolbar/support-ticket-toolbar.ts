import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support-ticket-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-ticket-toolbar.html',
  styleUrl: './support-ticket-toolbar.scss'
})
export class SupportTicketToolbar {

  search = '';

  @Output() searchChange = new EventEmitter<string>();

  onSearch(value: string) {
    this.search = value;
    this.searchChange.emit(value);
  }

}