import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  /**
   * Get the Supabase client instance
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('Exception refreshing session:', error);
      return null;
    }
  }

  /**
   * Execute a query with timeout to prevent hanging on stale connections
   */
  async withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - connection may be stale')), timeoutMs)
      )
    ]);
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName: string) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
  }

  /**
   * Sign out
   */
  async signOut() {
    return await this.supabase.auth.signOut();
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    return await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Check if session is valid and refresh if needed
   */
  async ensureValidSession(): Promise<boolean> {
    try {
      const session = await this.getSession();
      
      if (!session) {
        return false;
      }

      // Check if session is about to expire (within 60 seconds)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < 60000) {
        console.log('[SupabaseService] Session expiring soon, refreshing...');
        const refreshedSession = await this.refreshSession();
        return refreshedSession !== null;
      }

      return true;
    } catch (error) {
      console.error('[SupabaseService] Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(bucket: string, path: string, file: File) {
    return await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string) {
    return await this.supabase.storage
      .from(bucket)
      .remove([path]);
  }
}
