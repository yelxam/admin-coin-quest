-- Create a function to get the ranking (top users by balance)
-- This function is public and can be called by any authenticated user
CREATE OR REPLACE FUNCTION public.get_user_ranking()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  balance integer,
  rank bigint
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.id as user_id,
    p.full_name,
    COALESCE(SUM(t.amount), 0)::INTEGER as balance,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(t.amount), 0) DESC) as rank
  FROM public.profiles p
  LEFT JOIN public.transactions t ON p.id = t.user_id
  GROUP BY p.id, p.full_name
  ORDER BY balance DESC
$$;