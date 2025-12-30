import { Component, signal, HostListener } from '@angular/core';
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Find all dropdown containers
    const languageDropdown = document.querySelector('.navbar-actions .dropdown:first-child');
    const userDropdown = document.querySelector('.navbar-actions .dropdown:last-child');
    
    // Check if click is outside language dropdown
    if (this.languageMenuOpen() && languageDropdown && !languageDropdown.contains(target)) {
      this.languageMenuOpen.set(false);
    }
    
    // Check if click is outside user dropdown
    if (this.userMenuOpen() && userDropdown && !userDropdown.contains(target)) {
      this.userMenuOpen.set(false);
    }
  }

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

  getUserInitial(): string {
    const email = this.authService.currentUser()?.email;
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  }
}
