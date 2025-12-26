import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from './core/services/translate.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('cooksmart');

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    // Translation service is initialized in constructor
    // Language is loaded from localStorage or defaults to 'bg'
  }
}
