-- Update the Membership Changes (Member Updates) form to use iframe embed
UPDATE public.cognito_forms
SET cognito_embed = '<iframe src="https://www.cognitoforms.com/f/K4Fk3PtQHE-6M-fMiX2fVA/411" allow="payment" style="border:0;width:100%;" height="2484"></iframe><script src="https://www.cognitoforms.com/f/iframe.js"></script>',
    updated_at = now()
WHERE slug = '/membership-changes/';
