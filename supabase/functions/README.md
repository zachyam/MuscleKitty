# Supabase Edge Functions

This directory contains Supabase Edge Functions that provide server-side functionality for MuscleKitty.

## Functions

### delete-user

This function is used to delete a Supabase auth user. It requires the user to be authenticated and can only delete the authenticated user's account.

## Deployment Instructions

To deploy these functions to your Supabase project, follow these steps:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Log in to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

4. Deploy the functions:
   ```bash
   supabase functions deploy delete-user
   ```

5. Set required secrets for the functions:
   ```bash
   supabase secrets set SUPABASE_SERVICE_KEY=<your-service-role-key>
   ```

## Security Considerations

- The Edge Functions use service role credentials to access the Supabase admin API
- Authentication is enforced to ensure users can only delete their own accounts
- CORS is enabled to allow requests from your client application

## Testing

You can test the function using curl or any HTTP client:

```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/delete-user \
  -H "Authorization: Bearer <user-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<user-id>"}'
```

The response should be a JSON object with `success` and `message` fields if successful.