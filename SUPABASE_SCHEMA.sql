-- ==============================================================================
-- GAMER JOURNAL: SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. CREAR TABLA: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nickname TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Seguridad de Filas) para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para profiles
CREATE POLICY "Users can view public profiles or own" 
  ON profiles FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = user_id);


-- ==============================================================================
-- 2. CREAR TABLA: wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id BIGINT NOT NULL,
  game_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, game_id) -- Un usuario no puede tener el mismo juego dos veces
);

-- Habilitar RLS (Seguridad de Filas) para wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad para wishlists
-- Los usuarios solo pueden ver sus propios juegos en la wishlist
CREATE POLICY "Users can view their own wishlists" 
  ON wishlists FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar juegos en su propia wishlist
CREATE POLICY "Users can insert into their own wishlists" 
  ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden borrar juegos de su propia wishlist
CREATE POLICY "Users can delete from their own wishlists" 
  ON wishlists FOR DELETE USING (auth.uid() = user_id);


-- ==============================================================================
-- 3. TRIGGER: Crear perfil automáticamente al registrarse (Sign up)
-- Esto asegura que cada usuario nuevo en la tabla "auth.users" tenga un registro
-- correspondiente en nuestra tabla pública "profiles".

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar el trigger para que escuche las inserciones en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- Fin del esquema
