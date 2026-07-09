import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-credits',
  standalone: true,
  templateUrl: './credits.html',
  styleUrl: './credits.scss',
})
export class Credits {
  readonly isOpen = signal(false);

  readonly links = {
    github: 'https://github.com/junaidsultanxyz',
    linkedin: 'https://linkedin.com/in/junaidxyz',
    website: 'https://junaidsultan.com',
    email: 'contact@junaidsultan.com',
  };

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onBackdropClick(): void {
    this.close();
  }
}
