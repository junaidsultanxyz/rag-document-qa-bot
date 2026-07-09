import { Injectable, signal } from '@angular/core';
import { Conversation } from '../models/chat.model';

const STORAGE_KEY = 'rag_conversations';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private conversationsSignal = signal<Conversation[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  get conversations() {
    return this.conversationsSignal.asReadonly();
  }

  loadFromStorage(): Conversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.conversationsSignal.set([]);
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.conversationsSignal.set([]);
        return [];
      }
      this.conversationsSignal.set(parsed);
      return parsed;
    } catch {
      this.conversationsSignal.set([]);
      return [];
    }
  }

  saveConversations(conversations: Conversation[]): void {
    this.conversationsSignal.set(conversations);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      console.error('Failed to save conversations to localStorage');
    }
  }

  addConversation(conversation: Conversation): void {
    const current = this.conversationsSignal();
    this.saveConversations([conversation, ...current]);
  }

  updateConversation(updated: Conversation): void {
    const current = this.conversationsSignal();
    const index = current.findIndex((c) => c.id === updated.id);
    if (index === -1) return;
    const next = [...current];
    next[index] = updated;
    this.saveConversations(next);
  }

  deleteConversation(id: string): void {
    const current = this.conversationsSignal();
    this.saveConversations(current.filter((c) => c.id !== id));
  }
}
