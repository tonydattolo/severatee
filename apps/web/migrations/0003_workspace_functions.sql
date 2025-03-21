-- Create the has_workspace_role function
CREATE OR REPLACE FUNCTION public.has_workspace_role(
  workspace_id uuid,
  allowed_roles text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role workspace_role;
BEGIN
  SELECT role INTO user_role
  FROM workspace_members
  WHERE workspace_members.workspace_id = $1
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.deleted_at IS NULL;

  RETURN user_role = ANY(allowed_roles);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_workspace_role TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.has_workspace_role IS 'Checks if the current user has one of the allowed roles in a workspace'; 