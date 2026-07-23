-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  custom_domain TEXT,
  facebook_pixel TEXT,
  google_analytics TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create themes table for design customization
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL DEFAULT 'cyan-teal',
  button_style TEXT NOT NULL DEFAULT 'rounded',
  font_family TEXT NOT NULL DEFAULT 'inter',
  custom_primary_color TEXT,
  custom_secondary_color TEXT,
  custom_background_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Create links table
CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clicks table for analytics
CREATE TABLE public.clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page_views table for profile views
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by handle" 
  ON public.profiles FOR SELECT 
  USING (handle IS NOT NULL);

-- RLS Policies for themes
CREATE POLICY "Users can view their own theme" 
  ON public.themes FOR SELECT 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own theme" 
  ON public.themes FOR INSERT 
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own theme" 
  ON public.themes FOR UPDATE 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Public themes are viewable" 
  ON public.themes FOR SELECT 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE handle IS NOT NULL));

-- RLS Policies for links
CREATE POLICY "Users can view their own links" 
  ON public.links FOR SELECT 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own links" 
  ON public.links FOR INSERT 
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own links" 
  ON public.links FOR UPDATE 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own links" 
  ON public.links FOR DELETE 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Active links are publicly viewable" 
  ON public.links FOR SELECT 
  USING (active = true AND profile_id IN (SELECT id FROM public.profiles WHERE handle IS NOT NULL));

-- RLS Policies for clicks (users can view their link clicks)
CREATE POLICY "Users can view clicks on their links" 
  ON public.clicks FOR SELECT 
  USING (link_id IN (
    SELECT l.id FROM public.links l 
    JOIN public.profiles p ON l.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert clicks" 
  ON public.clicks FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for page_views
CREATE POLICY "Users can view their page views" 
  ON public.page_views FOR SELECT 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert page views" 
  ON public.page_views FOR INSERT 
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate random slug
CREATE OR REPLACE FUNCTION public.generate_slug()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create indexes for better performance
CREATE INDEX idx_profiles_handle ON public.profiles(handle);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_links_profile_id ON public.links(profile_id);
CREATE INDEX idx_links_slug ON public.links(slug);
CREATE INDEX idx_links_active ON public.links(active);
CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at);
CREATE INDEX idx_page_views_profile_id ON public.page_views(profile_id);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);

-- Create storage buckets for avatars and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails
CREATE POLICY "Thumbnail images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload their own thumbnails" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own thumbnails" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own thumbnails" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);