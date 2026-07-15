import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTable } from '../../../../../../shared/ui/data-table/data-table';

import { TableColumn } from '../../../../../../shared/models/table-column.model';
import { TableAction } from '../../../../../../shared/models/table-action.model';

import { KnowledgeBaseService } from '../../../../../../core/services/knowledge-base.service';

import { KnowledgePageService } from '../../services/knowledge-page.service';

@Component({
  selector: 'app-kb-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTable
  ],
  templateUrl: './kb-list.html',
  styleUrl: './kb-list.scss'
})
export class KbList {

  constructor(
    private kb: KnowledgeBaseService,
    private page: KnowledgePageService
  ) {}

  columns: TableColumn[] = [

    {
      key: 'title',
      label: 'Title'
    },

    {
      key: 'category',
      label: 'Category'
    },

    {
      key: 'tags',
      label: 'Tags'
    },

    {
      key: 'updatedAt',
      label: 'Updated'
    }

  ];

  actions: TableAction[] = [

    {
      label: 'Edit',
      color: 'primary',
      action: 'edit'
    },

    {
      label: 'Delete',
      color: 'danger',
      action: 'delete'
    }

  ];

  get rows() {

    const search = this.page.searchText().toLowerCase().trim();

    const articles = this.kb
      .getAll()
      .map(article => ({

        ...article,

        tags: article.tags.join(', '),

        updatedAt: article.updatedAt.toLocaleDateString()

      }));

    if (!search) {

      return articles;

    }

    return articles.filter(article =>

      article.title.toLowerCase().includes(search) ||

      article.category.toLowerCase().includes(search) ||

      article.tags.toLowerCase().includes(search) ||

      article.content.toLowerCase().includes(search)

    );

  }

  handleAction(event: any) {

    switch (event.action) {

      case 'edit': {

        const article = this.kb.getById(event.row.id);

        if (article) {

          this.page.startEdit(article);

        }

        break;

      }

      case 'delete':

        if (confirm('Delete this article?')) {

          this.kb.delete(event.row.id);

        }

        break;

    }

  }

}
