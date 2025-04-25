
-- Create a function to insert a session record for a user
CREATE OR REPLACE FUNCTION public.create_user_session_record(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO auth.sessions (
    id,
    user_id,
    created_at,
    updated_at,
    factor_id,
    aal,
    not_after
  )
  VALUES (
    gen_random_uuid(),
    user_id_param,
    now(),
    now(),
    NULL,
    'aal1',
    NULL
  );
END;
$$;
