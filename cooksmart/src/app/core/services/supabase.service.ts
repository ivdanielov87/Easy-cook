import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize or reinitialize the Supabase client
   */
  private initializeClient(): void {
    console.log('[SupabaseService] Initializing Supabase client...');
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'X-Client-Info': 'cooksmart-web'
          }
        }
      }
    );
    console.log('[SupabaseService] Supabase client initialized');
  }

  /**
   * Reinitialize the Supabase client (useful for recovering from stale connections)
   */
  reinitializeClient(): void {
    console.log('[SupabaseService] Reinitializing Supabase client due to stale connection...');
    this.initializeClient();
  }

  /**
   * Test Supabase connection health
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('[SupabaseService] Testing connection...');
      const result = await Promise.race([
        this.supabase.from('recipes').select('id').limit(1),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        )
      ]);
      
      const { error } = result as any;
      if (error) {
        console.error('[SupabaseService] Connection test failed:', error);
        return { success: false, message: `Database error: ${error.message}` };
      }
      
      console.log('[SupabaseService] Connection test successful');
      return { success: true, message: 'Connected successfully' };
    } catch (err: any) {
      console.error('[SupabaseService] Connection test error:', err);
      return { 
        success: false, 
        message: err.message?.includes('timeout') 
          ? 'Connection timeout - Supabase may be unreachable or paused'
          : `Connection error: ${err.message}`
      };
    }
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
    try {
      const result = await Promise.race([
        this.supabase.auth.getUser(),
        new Promise<never>((_, reject) => 
          setTimeout(() => {
            console.error('[SupabaseService] getCurrentUser() TIMEOUT after 5 seconds');
            reject(new Error('getCurrentUser timeout'));
          }, 5000)
        )
      ]);
      const { data: { user } } = result;
      return user;
    } catch (error) {
      console.error('[SupabaseService] getCurrentUser() error:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const result = await Promise.race([
        this.supabase.auth.getSession(),
        new Promise<never>((_, reject) => 
          setTimeout(() => {
            console.error('[SupabaseService] getSession() TIMEOUT after 5 seconds');
            reject(new Error('getSession timeout'));
          }, 5000)
        )
      ]);
      const { data: { session } } = result;
      return session;
    } catch (error) {
      console.error('[SupabaseService] getSession() error:', error);
      return null;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<Session | null> {
    try {
      const result = await Promise.race([
        this.supabase.auth.refreshSession(),
        new Promise<never>((_, reject) => 
          setTimeout(() => {
            console.error('[SupabaseService] refreshSession() TIMEOUT after 5 seconds');
            reject(new Error('refreshSession timeout'));
          }, 5000)
        )
      ]);
      const { data: { session }, error } = result;
      if (error) {
        console.error('[SupabaseService] Error refreshing session:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('[SupabaseService] Exception refreshing session:', error);
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
   * Execute a query with automatic retry on timeout/connection errors
   */
  async withRetry<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 2,
    timeoutMs: number = 5000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[SupabaseService] Query attempt ${attempt + 1}/${maxRetries + 1}`);
        
        const result = await Promise.race([
          queryFn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => {
              console.error(`[SupabaseService] Timeout on attempt ${attempt + 1}`);
              reject(new Error('Request timeout - connection may be stale'));
            }, timeoutMs)
          )
        ]);
        
        console.log(`[SupabaseService] Query succeeded on attempt ${attempt + 1}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`[SupabaseService] Query failed on attempt ${attempt + 1}:`, error.message);
        
        // If this is not the last attempt, reinitialize client and retry
        if (attempt < maxRetries) {
          // Reinitialize the Supabase client to recover from stale connection
          if (attempt === 0) {
            console.log('[SupabaseService] First retry - reinitializing client...');
            this.reinitializeClient();
          }
          
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.log(`[SupabaseService] Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    console.error(`[SupabaseService] All retry attempts failed`);
    throw lastError || new Error('Query failed after all retries');
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
