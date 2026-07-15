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
  AIHistoryMessage,
  AIService
} from '../../../../../../core/services/ai/ai.service';

import {
  SpeechService,
  SpeechState
} from '../../../../../../core/services/ai/speech.service';

import { VisionService } from '../../../../../../core/services/ai/vision.service';

import { ConversationService } from '../../../../../../core/services/conversation.service';

import { MockDataService } from '../../../../../../core/services/mock-data.service';

import { TicketService } from '../../../../../../core/services/ticket.service';

@Component({
  selector: 'app-customer-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './customer-chat-window.html',
  styleUrl: './customer-chat-window.scss'
})
export class CustomerChatWindow {

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  message = '';

  selectedImage: string | null = null;

  selectedImageFile: File | null = null;

  loading = false;

  imageLoading = false;

  speechState: SpeechState = 'idle';

  speechError = '';

  constructor(
    public mockData: MockDataService,
    private conversationService: ConversationService,
    private speechService: SpeechService,
    private visionService: VisionService,
    private aiService: AIService,
    private ticketService: TicketService,
    private cdr: ChangeDetectorRef
  ) {

    effect(() => {

      const conversation =
        this.mockData.selectedConversation();

      const messageCount =
        conversation?.messages.length ?? 0;

      // Keeps the signal dependency active.
      void messageCount;

      this.scheduleScrollToBottom();

    });

  }

  async startVoice(): Promise<void> {

    this.speechError = '';

    await this.speechService.toggleRecording(

      (text: string) => {

        this.message = text;

        this.speechError = '';

        this.cdr.detectChanges();

      },

      (state: SpeechState) => {

        this.speechState = state;

        if (
          state === 'recording' ||
          state === 'processing'
        ) {
          this.speechError = '';
        }

        this.cdr.detectChanges();

      },

      (errorMessage: string) => {

        this.speechError = errorMessage;

        this.cdr.detectChanges();

      }

    );

  }

  async send(): Promise<void> {

    const conversation =
      this.mockData.selectedConversation();

    if (!conversation) return;

    if (
      this.loading ||
      this.imageLoading ||
      this.speechState !== 'idle'
    ) {
      return;
    }

    const customerMessage =
      this.message.trim();

    const imageFile =
      this.selectedImageFile;

    const imageUrl =
      this.selectedImage;

    if (
      !customerMessage &&
      !imageFile
    ) {
      return;
    }

    const conversationHistory:
      AIHistoryMessage[] =
      conversation.messages
        .filter(item =>
          item.text.trim().length > 0
        )
        .slice(-12)
        .map(item => ({
          role: item.sender,
          content: item.text
        }));

    const attachments: Attachment[] = [];

    if (
      imageFile &&
      imageUrl
    ) {

      attachments.push({
        id: this.createAttachmentId(),
        type: 'image',
        url: imageUrl,
        name: imageFile.name
      });

    }

    this.conversationService.sendCustomerMessage(
      conversation,
      customerMessage,
      attachments
    );

    const replyInArabic =
      this.shouldReplyInArabic(
        customerMessage,
        conversation.messages
      );

    this.message = '';

    this.loading = true;

    this.cdr.detectChanges();

    this.scheduleScrollToBottom();

    try {

      if (imageFile) {

        await this.analyzeSelectedImage(
          imageFile,
          replyInArabic
        );

      }

      if (customerMessage) {

        const result =
          await this.aiService.processMessage(
            customerMessage,
            conversationHistory
          );

        this.conversationService.sendAIMessage(
          conversation,
          result.reply
        );

        conversation.aiAnalysis.intent =
          result.analysis.intent;

        conversation.aiAnalysis.sentiment =
          result.analysis.sentiment;

        conversation.aiAnalysis.confidence =
          result.analysis.confidence;

        if (result.analysis.escalate) {

          conversation.status = 'agent';

        }

        const ticket =
          this.ticketService
            .createAutomaticTicket(
              conversation,
              customerMessage,
              result.analysis
            );

        if (ticket) {

          conversation.ticket = ticket;

          conversation.status = 'agent';

          this.sendTicketConfirmation(
            conversation,
            ticket.id,
            replyInArabic
          );

        } else {

          this.conversationService
            .saveConversation(
              conversation
            );

        }

      }

    } catch (error) {

      console.error(
        'Send error:',
        error
      );

      this.conversationService.sendAIMessage(
        conversation,
        replyInArabic
          ? 'تعذر إكمال طلبك حاليًا. يُرجى المحاولة مرة أخرى.'
          : 'Unable to complete your request. Please try again.'
      );

    } finally {

      this.loading = false;

      this.clearSelectedImage();

      this.cdr.detectChanges();

      this.scheduleScrollToBottom();

    }

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

    if (
      this.loading ||
      this.imageLoading
    ) {
      return;
    }

    this.clearSelectedImage();

    this.cdr.detectChanges();

  }

  async analyzeSelectedImage(
    file: File,
    replyInArabic: boolean
  ): Promise<void> {

    const conversation =
      this.mockData.selectedConversation();

    if (!conversation) return;

    this.imageLoading = true;

    this.cdr.detectChanges();

    this.scheduleScrollToBottom();

    try {

      const result =
        await this.visionService.analyzeImage(
          file
        );

      conversation.aiAnalysis.intent =
        result.intent;

      conversation.aiAnalysis.confidence =
        result.confidence;

      conversation.aiAnalysis.sentiment =
        result.sentiment;

      const confidencePercent =
        Math.round(
          result.confidence * 100
        );

      let aiMessage: string;

      if (replyInArabic) {

        aiMessage =
          result.possibleDamage
            ? [
                'لقد حللت الصورة المرفوعة.',
                'توجد مؤشرات بصرية محتملة على وجود تلف أو كسر في المنتج.',
                `نسبة الثقة في اكتشاف التلف: ${confidencePercent}%.`,
                'سيتم تصعيد الحالة إلى أحد موظفي الدعم لمراجعة الصورة، ويُرجى تجهيز رقم الطلب.'
              ].join(' ')
            : [
                'لقد حللت الصورة المرفوعة.',
                'لم يتم اكتشاف مؤشرات قوية وواضحة على وجود تلف في المنتج.',
                `نسبة الثقة: ${confidencePercent}%.`,
                'يمكن لموظف الدعم مراجعة الصورة يدويًا إذا كانت المشكلة ما زالت موجودة.'
              ].join(' ');

      } else {

        aiMessage =
          result.possibleDamage
            ? [
                'I analyzed the uploaded image.',
                'The image contains possible visual indicators of a damaged or broken product.',
                `Damage detection confidence: ${confidencePercent}%.`,
                'The case will be escalated to a support agent for review. Please have your order number ready.'
              ].join(' ')
            : [
                'I analyzed the uploaded image.',
                'No strong visual indicators of product damage were detected.',
                `Confidence: ${confidencePercent}%.`,
                'A support agent can still review the image manually if the issue continues.'
              ].join(' ');

      }

      this.conversationService.sendAIMessage(
        conversation,
        aiMessage
      );

      if (result.possibleDamage) {

        conversation.status = 'agent';

        const ticket =
          this.ticketService
            .createAutomaticTicket(
              conversation,
              this.getLatestCustomerText(
                conversation
              ),
              {
                intent: 'damaged_product',
                escalate: true
              }
            );

        if (ticket) {

          conversation.ticket = ticket;

          this.sendTicketConfirmation(
            conversation,
            ticket.id,
            replyInArabic
          );

        } else {

          this.conversationService
            .saveConversation(
              conversation
            );

        }

      }

    } catch (error) {

      console.error(
        'Vision analysis error:',
        error
      );

      this.conversationService.sendAIMessage(
        conversation,
        replyInArabic
          ? 'تعذر تحليل الصورة المرفوعة. يُرجى تجربة صورة أخرى واضحة.'
          : 'I could not analyze the uploaded image. Please try another clear image.'
      );

    } finally {

      this.imageLoading = false;

      this.cdr.detectChanges();

      this.scheduleScrollToBottom();

    }

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

  private shouldReplyInArabic(
    currentMessage: string,
    messages: Array<{
      sender: string;
      text: string;
    }>
  ): boolean {

    if (
      this.containsArabic(
        currentMessage
      )
    ) {

      return true;

    }

    const lastCustomerMessage =
      [...messages]
        .reverse()
        .find(message =>
          message.sender === 'customer' &&
          message.text.trim().length > 0
        );

    return lastCustomerMessage
      ? this.containsArabic(
          lastCustomerMessage.text
        )
      : false;

  }

  private containsArabic(
    text: string
  ): boolean {

    return /[\u0600-\u06FF]/.test(
      text
    );

  }

  private createAttachmentId(): string {

    return (
      `attachment-${Date.now()}-` +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );

  }

  private clearSelectedImage(): void {

    this.selectedImage = null;

    this.selectedImageFile = null;

  }

  private sendTicketConfirmation(
    conversation: NonNullable<
      ReturnType<MockDataService['selectedConversation']>
    >,
    ticketId: string,
    replyInArabic: boolean
  ): void {

    this.conversationService.sendAIMessage(
      conversation,
      replyInArabic
        ? `تم إنشاء تذكرة الدعم رقم ${ticketId} وتحويل المحادثة إلى موظف دعم. لن يتم إنشاء تذكرة أخرى لنفس المشكلة.`
        : `Support ticket ${ticketId} has been created and this conversation was escalated to a support agent. No duplicate ticket will be created for the same issue.`
    );

  }

  private getLatestCustomerText(
    conversation: NonNullable<
      ReturnType<MockDataService['selectedConversation']>
    >
  ): string {

    return [...conversation.messages]
      .reverse()
      .find(message =>
        message.sender === 'customer'
      )
      ?.text ?? '';

  }

}
