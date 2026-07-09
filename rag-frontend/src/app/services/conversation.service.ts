import { Injectable, computed, signal } from '@angular/core';
import { Conversation, Message } from '../models/chat.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private activeIdSignal = signal<string | null>(null);

  readonly conversations = computed(() => this.storage.conversations());
  readonly activeId = this.activeIdSignal.asReadonly();
  readonly activeConversation = computed(() => {
    const id = this.activeIdSignal();
    if (!id) return null;
    return this.conversations().find((c) => c.id === id) ?? null;
  });
  readonly hasActiveConversation = computed(() => this.activeConversation() !== null);

  constructor(private storage: StorageService) {
    const all = this.storage.conversations();
    if (all.length > 0) {
      this.activeIdSignal.set(all[0].id);
    }
  }

  createConversation(docId: string, docName: string): Conversation {
    const now = Date.now();
    const title = this.truncateTitle(docName.replace(/\.pdf$/i, ''));
    const conversation: Conversation = {
      id: this.generateId(),
      title,
      docId,
      docName,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.storage.addConversation(conversation);
    this.activeIdSignal.set(conversation.id);
    return conversation;
  }

  addMessage(conversationId: string, message: Message): void {
    const conv = this.conversations().find((c) => c.id === conversationId);
    if (!conv) return;
    const updated: Conversation = {
      ...conv,
      messages: [...conv.messages, message],
      updatedAt: Date.now(),
    };
    // Use first question as title if no good title yet
    if (message.role === 'user' && conv.title === this.truncateTitle(conv.docName.replace(/\.pdf$/i, ''))) {
      updated.title = this.truncateTitle(message.text);
    }
    this.storage.updateConversation(updated);
  }

  switchConversation(id: string): void {
    this.activeIdSignal.set(id);
  }

  deleteConversation(id: string): void {
    this.storage.deleteConversation(id);
    const remaining = this.conversations();
    if (this.activeIdSignal() === id) {
      this.activeIdSignal.set(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  startNewChat(): void {
    this.activeIdSignal.set(null);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  private truncateTitle(text: string, maxLen = 40): string {
    const trimmed = text.trim();
    return trimmed.length > maxLen ? trimmed.slice(0, maxLen) + '…' : trimmed;
  }
}
