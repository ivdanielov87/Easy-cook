import { Injectable, signal } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'bg' | 'en';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private readonly STORAGE_KEY = 'cooksmart_language';
  
  // Signal for current language
  currentLang = signal<SupportedLanguage>('bg');

  constructor(private translate: NgxTranslateService) {
    this.initializeLanguage();
  }

  /**
   * Initialize language from localStorage or use default (Bulgarian)
   */
  private initializeLanguage(): void {
    const savedLang = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage;
    const lang = savedLang && (savedLang === 'bg' || savedLang === 'en') ? savedLang : 'bg';
    
    this.setLanguage(lang);
  }

  /**
   * Set the application language
   * @param lang Language code ('bg' or 'en')
   */
  setLanguage(lang: SupportedLanguage): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }

  /**
   * Get instant translation for a key
   * @param key Translation key
   * @param params Optional parameters for interpolation
   */
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  /**
   * Get observable translation for a key
   * @param key Translation key
   * @param params Optional parameters for interpolation
   */
  get(key: string, params?: any) {
    return this.translate.get(key, params);
  }
}
