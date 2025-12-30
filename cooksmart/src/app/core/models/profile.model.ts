export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
}
