import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class Button {

  @Input() text = '';

  @Input() variant:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'danger'
    | 'success'
    = 'primary';

  @Input() disabled = false;

  @Input() loading = false;

  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<void>();

  onClick() {

    if (this.disabled || this.loading) return;

    this.clicked.emit();

  }

}