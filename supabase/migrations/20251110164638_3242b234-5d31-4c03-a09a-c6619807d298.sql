-- Fix infinite recursion in RLS policies

-- Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new non-recursive policies for profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles from same company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- Fix companies policy to avoid recursion
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (
  id IN (
    SELECT company_id 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

-- Ensure admins can delete companies
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;

CREATE POLICY "Admins can delete companies" 
ON public.companies 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));