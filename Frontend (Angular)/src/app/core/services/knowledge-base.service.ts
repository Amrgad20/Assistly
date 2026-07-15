import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { KnowledgeBase } from '../models/knowledge-base.model';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {

  private readonly api =
    'http://127.0.0.1:8000';

  constructor(
    private http: HttpClient
  ) {}

  private knowledge = signal<KnowledgeBase[]>([

    {
      id:'1',

      title:'Refund Policy',

      content:'Customers can request a refund within 14 days.',

      category:'Orders',

      tags:[
        'refund',
        'payment'
      ],

      createdAt:new Date(),

      updatedAt:new Date()
    },

    {
      id:'2',

      title:'Damaged Products',

      content:'Upload a photo and we will arrange a replacement.',

      category:'Shipping',

      tags:[
        'damage',
        'replacement'
      ],

      createdAt:new Date(),

      updatedAt:new Date()
    }

  ]);

  getAll(){

    return this.knowledge();

  }

  getById(id:string){

    return this.knowledge().find(x=>x.id===id);

  }

  search(keyword:string){

    keyword=keyword.toLowerCase();

    return this.knowledge().filter(article=>

      article.title.toLowerCase().includes(keyword)

      ||

      article.content.toLowerCase().includes(keyword)

      ||

      article.tags.some((tag: string) =>

        tag.toLowerCase().includes(keyword)

      )

    );

  }

  add(article:KnowledgeBase){

    this.knowledge.update(items=>[

      ...items,

      article

    ]);

    this.syncWithRAG();

  }

  update(article:KnowledgeBase){

    this.knowledge.update(items=>

      items.map(item=>

        item.id===article.id

        ? article

        : item

      )

    );

    this.syncWithRAG();

  }

  delete(id:string){

    this.knowledge.update(items=>

      items.filter(item=>

        item.id!==id

      )

    );

    this.syncWithRAG();

  }

  syncWithRAG(){

    console.log('Knowledge Base Synced with RAG');

  }

  uploadDocument(
    file: File
  ): Promise<KnowledgeUploadResult> {

    const formData = new FormData();

    formData.append(
      'file',
      file,
      file.name
    );

    return firstValueFrom(
      this.http.post<KnowledgeUploadResult>(
        `${this.api}/knowledge/upload`,
        formData
      )
    );

  }

}

export interface KnowledgeUploadResult {
  filename: string;
  document_id: string;
  chunks: number;
  status: string;
}
