import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'rag_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    if (isPlatformBrowser(platformId)) {
      // Apply initial theme class immediately before first render
      document.documentElement.classList.toggle(
        'dark',
        this.theme() === 'dark',
      );

      effect(() => {
        const t = this.theme();
        document.documentElement.classList.toggle('dark', t === 'dark');
        try {
          localStorage.setItem(THEME_KEY, t);
        } catch {
          // ignore
        }
      });
    }
  }

  toggle(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // ignore
    }
    return 'light';
  }
}
