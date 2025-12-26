import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models';
import { Session, User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Signals for reactive state management
  currentUser = signal<User | null>(null);
  currentProfile = signal<Profile | null>(null);
  isAuthenticated = signal<boolean>(false);
  isAdmin = signal<boolean>(false);
  loading = signal<boolean>(true);

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state
   */
  private async initializeAuth(): Promise<void> {
    try {
      // Get current session
      const session = await this.supabase.getSession();
      
      if (session?.user) {
        await this.setUserState(session.user);
      }

      // Listen to auth state changes
      this.supabase.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.setUserState(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.clearUserState();
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Set user state after authentication
   */
  private async setUserState(user: User): Promise<void> {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);

    // Fetch user profile
    const profile = await this.fetchUserProfile(user.id);
    if (profile) {
      this.currentProfile.set(profile);
      this.isAdmin.set(profile.role === 'admin');
    }
  }

  /**
   * Clear user state on sign out
   */
  private clearUserState(): void {
    this.currentUser.set(null);
    this.currentProfile.set(null);
    this.isAuthenticated.set(false);
    this.isAdmin.set(false);
  }

  /**
   * Fetch user profile from database
   */
  private async fetchUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.signIn(email, password);

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.setUserState(data.user);
        return { success: true };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign up with email, password, and display name
   */
  async signUp(email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.signUp(email, password, displayName);

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        return { success: true };
      }

      return { success: false, error: 'Unknown error occurred' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.clearUserState();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { display_name?: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.currentUser();
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const { error } = await this.supabase.client
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile
      const profile = await this.fetchUserProfile(user.id);
      if (profile) {
        this.currentProfile.set(profile);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has admin role
   */
  hasAdminRole(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }
}
