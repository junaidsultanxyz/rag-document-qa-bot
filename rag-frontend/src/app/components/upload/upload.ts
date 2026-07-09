import { Component, inject, signal } from '@angular/core';
import { ConversationService } from '../../services/conversation.service';
import { RagService } from '../../services/rag.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrl: './upload.scss',
})
export class Upload {
  private readonly ragService = inject(RagService);
  private readonly conversationService = inject(ConversationService);

  readonly loading = signal(false);
  readonly error = signal('');

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.error.set('Please select a PDF file.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.ragService.upload(file).subscribe({
      next: (res) => {
        this.conversationService.createConversation(res.doc_id, file.name);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Upload failed. Is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
