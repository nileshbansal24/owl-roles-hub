CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    user_type,
    university,
    designation,
    approval_status
  )
  VALUES (
    new.id,
    lower(new.email),
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'candidate'),
    new.raw_user_meta_data ->> 'institution_name',
    new.raw_user_meta_data ->> 'designation',
    CASE 
      WHEN COALESCE(new.raw_user_meta_data ->> 'user_type', 'candidate') = 'recruiter' THEN 'pending'
      ELSE 'approved'
    END
  );
  RETURN new;
END;
$function$;

UPDATE public.profiles p
SET email = lower(u.email)
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '')
  AND u.email IS NOT NULL;