-- Discontinued products: no longer offer QR Life Code / Medical Records Vault
DELETE FROM public.plan_features
WHERE
  feature_name ~* 'medical records vault'
  OR feature_name ~* 'lifecode'
  OR (feature_name ~* 'qr' AND feature_name ~* 'life');
