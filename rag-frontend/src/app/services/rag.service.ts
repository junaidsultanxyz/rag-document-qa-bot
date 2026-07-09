import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UploadResponse {
  doc_id: string;
  pages: number;
  chunks: number;
}

export interface AskResponse {
  answer: string;
  sources: { page: number; snippet: string }[];
}

@Injectable({ providedIn: 'root' })
export class RagService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/upload`, formData);
  }

  ask(docId: string, question: string) {
    const formData = new FormData();
    formData.append('doc_id', docId);
    formData.append('question', question);
    return this.http.post<AskResponse>(`${this.baseUrl}/ask`, formData);
  }
}
