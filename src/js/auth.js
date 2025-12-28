import { supabase } from "./supabase.js";

// Registro de usuario
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

// Login
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Obtener usuario actual
export async function getCurrentUser() {
  return await supabase.auth.getUser();
}

// Escuchar cambios de autenticación
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

