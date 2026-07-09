import { Component, inject, signal } from '@angular/core';
import { ConversationService } from './services/conversation.service';
import { Sidebar } from './components/sidebar/sidebar';
import { Upload } from './components/upload/upload';
import { Chat } from './components/chat/chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Sidebar, Upload, Chat],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly conversationService = inject(ConversationService);

  readonly hasActiveConversation = this.conversationService.hasActiveConversation;
  readonly sidebarOpen = signal(false);

  openSidebar(): void {
    this.sidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
