CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE PLPGSQL 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE 
  user_role TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), NEW.email);
  
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  IF user_role NOT IN ('user', 'admin', 'manager') THEN 
    user_role := 'user'; 
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, user_role::app_role);
  
  RETURN NEW;
END; 
$$;