import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { KbToolbar } from './components/kb-toolbar/kb-toolbar';
import { KbList } from './components/kb-list/kb-list';
import { KbForm } from './components/kb-form/kb-form';

import { KnowledgePageService } from './services/knowledge-page.service';
import { KnowledgeBaseService } from '../../../../core/services/knowledge-base.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    KbToolbar,
    KbList,
    KbForm
  ],
  templateUrl: './knowledge-base.html',
  styleUrl: './knowledge-base.scss'
})
export class KnowledgeBase {

  uploadLoading = false;

  uploadMessage = '';

  uploadError = '';

  constructor(
    public page: KnowledgePageService,
    private knowledgeService:
      KnowledgeBaseService
  ) {}

  async uploadDocument(
    event: Event
  ): Promise<void> {

    const input =
      event.target as HTMLInputElement;

    const file = input.files?.[0];

    input.value = '';

    if (!file) return;

    this.uploadMessage = '';

    this.uploadError = '';

    const extension = file.name
      .split('.')
      .pop()
      ?.toLowerCase();

    if (
      extension !== 'pdf' &&
      extension !== 'txt'
    ) {
      this.uploadError =
        'Please select a PDF or TXT file.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError =
        'The document must be 10 MB or smaller.';
      return;
    }

    this.uploadLoading = true;

    try {

      const result =
        await this.knowledgeService
          .uploadDocument(file);

      this.uploadMessage =
        `${result.filename} uploaded successfully ` +
        `(${result.chunks} chunks). It is ready for RAG.`;

    } catch (error: any) {

      this.uploadError =
        error?.error?.detail ??
        'The document could not be uploaded.';

    } finally {

      this.uploadLoading = false;

    }

  }

}
