import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AIHistoryMessage {
  role: 'customer' | 'ai' | 'agent';
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {

  private readonly api =
    'http://127.0.0.1:8000';

  constructor(
    private http: HttpClient
  ) {}

  async processMessage(
    message: string,
    conversationHistory:
      AIHistoryMessage[] = []
  ) {

    const response =
      await firstValueFrom(
        this.http.post<any>(
          `${this.api}/ai/chat`,
          {
            message,
            conversation_history:
              conversationHistory.slice(-12)
          }
        )
      );

    return {
      reply: response.reply,
      analysis: response.analysis,
      rag: response.rag,
      crm: response.crm,
      memory: response.memory
    };

  }

}
