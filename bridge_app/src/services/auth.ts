import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export type { User };

/** Gets existing session or creates an anonymous one. Returns null if Supabase unavailable or auth fails. */
export async function ensureSession(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Converts anonymous account to a named account with email + password.
 *  Supabase sends a confirmation email — account is fully named once confirmed. */
export async function upgradeAccount(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
}

/** Signs in with email + password (for existing named accounts). */
export async function signIn(email: string, password: string): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/** Signs out the current user. */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Subscribes to auth state changes. Returns an unsubscribe function. */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
