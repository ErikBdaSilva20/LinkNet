-- Função auxiliar para gerar handle único baseado no email
CREATE OR REPLACE FUNCTION public.generate_unique_handle(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  candidate_handle text;
  counter integer := 0;
BEGIN
  -- Extrai a parte antes do @ e remove caracteres especiais
  base_handle := lower(regexp_replace(split_part(p_email, '@', 1), '[^a-z0-9]', '', 'g'));
  
  -- Limita a 15 caracteres
  base_handle := left(base_handle, 15);
  
  -- Se vazio, usa 'user'
  IF base_handle = '' THEN
    base_handle := 'user';
  END IF;
  
  candidate_handle := base_handle;
  
  -- Verifica unicidade e adiciona números se necessário
  WHILE EXISTS (SELECT 1 FROM profiles WHERE handle = candidate_handle) LOOP
    counter := counter + 1;
    candidate_handle := base_handle || counter::text;
  END LOOP;
  
  RETURN candidate_handle;
END;
$$;

-- Atualiza a função handle_new_user para criar profile, page, theme e integrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_profile_id uuid;
  new_page_id uuid;
  suggested_handle text;
  user_display_name text;
BEGIN
  -- Extrai display_name do metadata ou email
  user_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Gera handle único baseado no email
  suggested_handle := generate_unique_handle(NEW.email);
  
  -- Cria o profile
  INSERT INTO public.profiles (user_id, display_name, handle, is_public)
  VALUES (NEW.id, user_display_name, suggested_handle, true)
  RETURNING id INTO new_profile_id;
  
  -- Cria a página default
  INSERT INTO public.pages (profile_id, title, description)
  VALUES (new_profile_id, user_display_name, 'Minha página de links')
  RETURNING id INTO new_page_id;
  
  -- Cria o theme default
  INSERT INTO public.themes (page_id)
  VALUES (new_page_id);
  
  -- Cria o registro de integrations vazio
  INSERT INTO public.integrations (page_id)
  VALUES (new_page_id);
  
  RETURN NEW;
END;
$$;

-- Recria o trigger caso não exista
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();