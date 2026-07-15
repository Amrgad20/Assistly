import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { KnowledgeBaseService } from '../../../../../../core/services/knowledge-base.service';
import { KnowledgeBase } from '../../../../../../core/models/knowledge-base.model';

import { KnowledgePageService } from '../../services/knowledge-page.service';

@Component({
  selector: 'app-kb-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './kb-form.html',
  styleUrl: './kb-form.scss'
})
export class KbForm {

  article: KnowledgeBase = {

    id: '',

    title: '',

    category: '',

    content: '',

    tags: [],

    createdAt: new Date(),

    updatedAt: new Date()

  };

  tags = '';

  constructor(

    private kb: KnowledgeBaseService,

    public page: KnowledgePageService

  ) {

    effect(() => {

      const editing = this.page.currentArticle();

      if (!editing) {

        this.reset();

        return;

      }

      this.article = {

        ...editing

      };

      this.tags = editing.tags.join(', ');

    });

  }

  save() {

    if (!this.article.title.trim()) return;

    if (!this.article.content.trim()) return;

    this.article.tags = this.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    this.article.updatedAt = new Date();

    if (this.page.isEditMode) {

      this.kb.update(this.article);

    } else {

      this.article.id = crypto.randomUUID();

      this.article.createdAt = new Date();

      this.kb.add(this.article);

    }

    this.page.closeForm();

    this.reset();

  }

  cancel() {

    this.page.closeForm();

    this.reset();

  }

  reset() {

    this.article = {

      id: '',

      title: '',

      category: '',

      content: '',

      tags: [],

      createdAt: new Date(),

      updatedAt: new Date()

    };

    this.tags = '';

  }

}