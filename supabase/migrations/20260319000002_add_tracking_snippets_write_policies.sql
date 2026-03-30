-- Add missing INSERT/UPDATE/DELETE RLS policies for tracking_snippets and tracking_platforms
-- Previously only SELECT policies existed, blocking all admin writes.

-- tracking_snippets: admin can insert
CREATE POLICY "Admin can insert tracking snippets"
  ON public.tracking_snippets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- tracking_snippets: admin can update
CREATE POLICY "Admin can update tracking snippets"
  ON public.tracking_snippets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- tracking_snippets: admin can delete
CREATE POLICY "Admin can delete tracking snippets"
  ON public.tracking_snippets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- tracking_platforms: admin can update
CREATE POLICY "Admin can update tracking platforms"
  ON public.tracking_platforms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
