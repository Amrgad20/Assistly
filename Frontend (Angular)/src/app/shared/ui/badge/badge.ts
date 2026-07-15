import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class Badge {

  @Input() text = '';

  @Input() variant:
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'secondary'
    = 'primary';

}