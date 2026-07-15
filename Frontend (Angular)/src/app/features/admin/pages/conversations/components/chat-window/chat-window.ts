import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  effect
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Attachment } from '../../../../../../core/models/attachment.model';

import {
  SpeechService,
  SpeechState
} from '../../../../../../core/services/ai/speech.service';

import { ConversationService } from '../../../../../../core/services/conversation.service';

import { MockDataService } from '../../../../../../core/services/mock-data.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss'
})
export class ChatWindow {

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  message = '';

  selectedImage: string | null = null;

  selectedImageFile: File | null = null;

  sending = false;

  speechState: SpeechState = 'idle';

  constructor(
    public mockData: MockDataService,
    private conversationService: ConversationService,
    private speechService: SpeechService,
    private cdr: ChangeDetectorRef
  ) {

    effect(() => {

      const conversation =
        this.mockData.selectedConversation();

      const messageCount =
        conversation?.messages.length ?? 0;

      void messageCount;

      this.scheduleScrollToBottom();

    });

  }

  async startVoice(): Promise<void> {

    await this.speechService.toggleRecording(

      (text: string) => {

        this.message = text;

        this.cdr.detectChanges();

      },

      (state: SpeechState) => {

        this.speechState = state;

        this.cdr.detectChanges();

      },

      (errorMessage: string) => {

        alert(errorMessage);

        this.cdr.detectChanges();

      }

    );

  }

  send(): void {

    const conversation =
      this.mockData.selectedConversation();

    if (!conversation) return;

    if (
      this.sending ||
      this.speechState !== 'idle'
    ) {
      return;
    }

    const agentMessage =
      this.message.trim();

    if (
      !agentMessage &&
      !this.selectedImageFile
    ) {
      return;
    }

    this.sending = true;

    const attachments: Attachment[] = [];

    if (
      this.selectedImageFile &&
      this.selectedImage
    ) {

      attachments.push({
        id: this.createAttachmentId(),
        type: 'image',
        url: this.selectedImage,
        name: this.selectedImageFile.name
      });

    }

    this.conversationService.sendAgentMessage(
      conversation,
      agentMessage,
      attachments
    );

    this.message = '';

    this.clearSelectedImage();

    this.sending = false;

    this.cdr.detectChanges();

    this.scheduleScrollToBottom();

  }

  onImageSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file =
      input.files[0];

    if (!file.type.startsWith('image/')) {

      alert(
        'Please select a valid image file.'
      );

      input.value = '';

      return;

    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {

      alert(
        'The image must be smaller than 10 MB.'
      );

      input.value = '';

      return;

    }

    this.selectedImageFile = file;

    const reader =
      new FileReader();

    reader.onload = () => {

      this.selectedImage =
        reader.result as string;

      this.cdr.detectChanges();

    };

    reader.onerror = () => {

      this.clearSelectedImage();

      alert(
        'The selected image could not be read.'
      );

    };

    reader.readAsDataURL(file);

    input.value = '';

  }

  removeImage(): void {

    if (this.sending) return;

    this.clearSelectedImage();

    this.cdr.detectChanges();

  }

  private scheduleScrollToBottom(): void {

    setTimeout(() => {

      this.scrollToBottom();

    }, 0);

  }

  private scrollToBottom(): void {

    const container =
      this.messagesContainer?.nativeElement;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });

  }

  private clearSelectedImage(): void {

    this.selectedImage = null;

    this.selectedImageFile = null;

  }

  private createAttachmentId(): string {

    return (
      `attachment-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );

  }

}