import {
  Component,
  inject,
  signal,
  computed,
  ElementRef,
  AfterViewChecked,
  ViewChild,
  SecurityContext,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { ConversationService } from '../../services/conversation.service';
import { RagService } from '../../services/rag.service';
import { Message } from '../../models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat implements AfterViewChecked {
  private readonly ragService = inject(RagService);
  private readonly conversationService = inject(ConversationService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLDivElement>;

  readonly conversation = this.conversationService.activeConversation;
  readonly question = signal('');
  readonly waiting = signal(false);

  private readonly canSend = computed(() => {
    const q = this.question().trim();
    const conv = this.conversation();
    return q.length > 0 && conv !== null && !this.waiting();
  });

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  renderMarkdown(text: string): SafeHtml {
    const raw = marked.parse(text, { async: false }) as string;
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  send(): void {
    const conv = this.conversation();
    if (!this.canSend() || !conv) return;

    const text = this.question().trim();
    this.question.set('');

    const userMsg: Message = {
      id: this.generateId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    this.conversationService.addMessage(conv.id, userMsg);
    this.waiting.set(true);

    this.ragService.ask(conv.docId, text).subscribe({
      next: (res) => {
        const assistantMsg: Message = {
          id: this.generateId(),
          role: 'assistant',
          text: res.answer,
          sources: res.sources ?? [],
          timestamp: Date.now(),
        };
        this.conversationService.addMessage(conv.id, assistantMsg);
        this.waiting.set(false);
      },
      error: () => {
        const errorMsg: Message = {
          id: this.generateId(),
          role: 'assistant',
          text: 'Something went wrong answering that question.',
          timestamp: Date.now(),
        };
        this.conversationService.addMessage(conv.id, errorMsg);
        this.waiting.set(false);
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  private scrollToBottom(): void {
    if (this.scrollAnchor) {
      this.scrollAnchor.nativeElement.scrollIntoView({ behavior: 'instant' });
    }
  }
}
