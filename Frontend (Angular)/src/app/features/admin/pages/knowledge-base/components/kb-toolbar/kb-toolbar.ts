import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { KnowledgePageService } from '../../services/knowledge-page.service';

@Component({
  selector: 'app-kb-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './kb-toolbar.html',
  styleUrl: './kb-toolbar.scss'
})
export class KbToolbar {

  search = '';

  constructor(
    private page: KnowledgePageService
  ) {}

  onSearch(value: string) {

    this.search = value;

    this.page.setSearch(value);

  }

}