import { supabase } from "./supabase.js";

// Registro de usuario
export async function signUp(email, password) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

// Login
export async function signIn(email, password) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Logout
export async function signOut() {
  if (!supabase) {
    return { error: { message: "Supabase not configured" } };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Obtener usuario actual
export async function getCurrentUser() {
  if (!supabase) {
    return { data: { user: null }, error: { message: "Supabase not configured" } };
  }
  return await supabase.auth.getUser();
}

// Escuchar cambios de autenticación
export function onAuthStateChange(callback) {
  if (!supabase) {
    return { data: { subscription: null } };
  }
  return supabase.auth.onAuthStateChange(callback);
}

