import { Component, inject } from '@angular/core';
import { ConversationService } from '../../services/conversation.service';
import { ThemeService } from '../../services/theme.service';
import { Credits } from '../credits/credits';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [Credits],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly conversationService = inject(ConversationService);
  readonly themeService = inject(ThemeService);

  readonly conversations = this.conversationService.conversations;
  readonly activeId = this.conversationService.activeId;

  onSelectConversation(id: string): void {
    this.conversationService.switchConversation(id);
  }

  onDeleteConversation(id: string, event: Event): void {
    event.stopPropagation();
    this.conversationService.deleteConversation(id);
  }

  onNewChat(): void {
    this.conversationService.startNewChat();
  }
}
