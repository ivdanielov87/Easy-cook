import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService, SupportedLanguage } from '../../core/services/translate.service';
import { routeFadeIn } from '../../shared/animations';

@Component({
  selector: 'app-admin-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  animations: [routeFadeIn]
})
export class AdminLayout {
  sidebarOpen = signal<boolean>(true);
  languageMenuOpen = signal<boolean>(false);

  constructor(
    public authService: AuthService,
    public translateService: TranslateService
  ) {}

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  toggleLanguageMenu(): void {
    this.languageMenuOpen.update(value => !value);
  }

  switchLanguage(lang: SupportedLanguage): void {
    this.translateService.setLanguage(lang);
    this.languageMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
