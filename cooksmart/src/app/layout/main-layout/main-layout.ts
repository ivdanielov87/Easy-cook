import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService, SupportedLanguage } from '../../core/services/translate.service';
import { routeFadeIn, fadeInOut } from '../../shared/animations';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslateModule
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  animations: [routeFadeIn, fadeInOut]
})
export class MainLayout {
  mobileMenuOpen = signal<boolean>(false);
  languageMenuOpen = signal<boolean>(false);
  userMenuOpen = signal<boolean>(false);

  constructor(
    public authService: AuthService,
    public translateService: TranslateService
  ) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  toggleLanguageMenu(): void {
    this.languageMenuOpen.update(value => !value);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(value => !value);
  }

  switchLanguage(lang: SupportedLanguage): void {
    this.translateService.setLanguage(lang);
    this.languageMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.userMenuOpen.set(false);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
