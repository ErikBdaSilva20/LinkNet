-- Criar paginas, temas e integracoes para perfis existentes que nao tem pagina
DO $$
DECLARE
  profile_record RECORD;
  new_page_id uuid;
BEGIN
  -- Loop por todos os perfis sem pagina
  FOR profile_record IN 
    SELECT pr.id, pr.display_name 
    FROM profiles pr
    WHERE NOT EXISTS (
      SELECT 1 FROM pages pg WHERE pg.profile_id = pr.id
    )
  LOOP
    -- Cria a pagina default
    INSERT INTO public.pages (profile_id, title, description)
    VALUES (profile_record.id, profile_record.display_name, 'Minha página de links')
    RETURNING id INTO new_page_id;
    
    -- Cria o theme default
    INSERT INTO public.themes (page_id)
    VALUES (new_page_id);
    
    -- Cria o registro de integrations vazio
    INSERT INTO public.integrations (page_id)
    VALUES (new_page_id);
  END LOOP;
END;
$$;