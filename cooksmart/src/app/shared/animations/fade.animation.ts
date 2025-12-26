import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Fade in/out animation for elements entering/leaving the DOM
 */
export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('250ms ease-in-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('250ms ease-in-out', style({ opacity: 0 }))
  ])
]);

/**
 * Fade in animation with slight upward movement
 * Perfect for content sections and cards
 */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/**
 * Fade in animation for route transitions
 */
export const routeFadeIn = trigger('routeFadeIn', [
  transition('* => *', [
    style({ opacity: 0 }),
    animate('300ms ease-in', style({ opacity: 1 }))
  ])
]);
