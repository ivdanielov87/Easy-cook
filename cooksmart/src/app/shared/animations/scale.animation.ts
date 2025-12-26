import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Scale up animation
 * Perfect for modals and dialogs
 */
export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
  ])
]);

/**
 * Scale up with bounce effect
 * Perfect for success messages and confirmations
 */
export const scaleInBounce = trigger('scaleInBounce', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.8)' }),
    animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
      style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/**
 * Pulse animation
 * Perfect for drawing attention to elements
 */
export const pulse = trigger('pulse', [
  transition('* => *', [
    animate('600ms ease-in-out', style({ transform: 'scale(1.05)' })),
    animate('600ms ease-in-out', style({ transform: 'scale(1)' }))
  ])
]);
