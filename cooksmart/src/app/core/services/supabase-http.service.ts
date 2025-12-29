import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseHttpService {
  private readonly baseUrl = `${environment.supabaseUrl}/rest/v1`;
  
  constructor(private http: HttpClient) {}

  /**
   * Get default headers for Supabase REST API
   * Uses user's access token if available, otherwise uses anon key
   */
  private async getHeaders(): Promise<HttpHeaders> {
    // Get user's access token from localStorage (where Supabase stores it)
    let authToken = environment.supabaseKey;
    
    try {
      const supabaseAuthKey = `sb-${environment.supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const authData = localStorage.getItem(supabaseAuthKey);
      
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.access_token) {
          authToken = parsed.access_token;
        }
      }
    } catch (error) {
      // Silently fall back to anon key
    }
    
    return new HttpHeaders({
      'apikey': environment.supabaseKey,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    });
  }

  /**
   * GET request to Supabase REST API
   */
  async get<T>(table: string, params?: Record<string, string>): Promise<{ data: T | null; error: any }> {
    try {
      let url = `${this.baseUrl}/${table}`;
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }
      
      const headers = await this.getHeaders();
      const data = await firstValueFrom(
        this.http.get<T>(url, { headers })
      );
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  /**
   * POST request to Supabase REST API
   */
  async post<T>(table: string, body: any): Promise<{ data: T | null; error: any }> {
    try {
      const headers = await this.getHeaders();
      const data = await firstValueFrom(
        this.http.post<T>(`${this.baseUrl}/${table}`, body, { headers })
      );
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  /**
   * PATCH request to Supabase REST API
   */
  async patch<T>(table: string, body: any, params?: Record<string, string>): Promise<{ data: T | null; error: any }> {
    try {
      let url = `${this.baseUrl}/${table}`;
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }
      
      const headers = await this.getHeaders();
      const data = await firstValueFrom(
        this.http.patch<T>(url, body, { headers })
      );
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  /**
   * DELETE request to Supabase REST API
   */
  async delete<T>(table: string, params: Record<string, string>): Promise<{ data: T | null; error: any }> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}/${table}?${queryString}`;
      
      const headers = await this.getHeaders();
      const data = await firstValueFrom(
        this.http.delete<T>(url, { headers })
      );
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
}
