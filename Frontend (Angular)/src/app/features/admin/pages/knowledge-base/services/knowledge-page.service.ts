import { Injectable, signal } from '@angular/core';

import { KnowledgeBase } from '../../../../../core/models/knowledge-base.model';

@Injectable({
  providedIn: 'root'
})
export class KnowledgePageService {

  private search = signal('');

  readonly searchText = this.search.asReadonly();

  private formOpen = signal(false);

  readonly isFormOpen = this.formOpen.asReadonly();

  private editingArticle = signal<KnowledgeBase | null>(null);

  readonly currentArticle = this.editingArticle.asReadonly();

  setSearch(value: string) {

    this.search.set(value);

  }

  openForm() {

    this.editingArticle.set(null);

    this.formOpen.set(true);

  }

  startEdit(article: KnowledgeBase) {

    this.editingArticle.set(article);

    this.formOpen.set(true);

  }

  closeForm() {

    this.formOpen.set(false);

    this.editingArticle.set(null);

  }

  get isEditMode() {

    return this.editingArticle() !== null;

  }

}