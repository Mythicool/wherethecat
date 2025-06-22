# Supabase Setup Guide for Where The Cat

This guide will help you set up Supabase for the Where The Cat application.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Basic understanding of SQL

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `wherethecat` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Configure Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the entire content from `supabase-setup.sql` file in this project
3. Paste it into the SQL Editor
4. Click "Run" to execute the SQL commands

This will create:
- `profiles` table for user information
- `cats` table for cat reports
- Row Level Security (RLS) policies
- Storage bucket for cat photos
- Necessary triggers and functions

## Step 3: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (something like `https://your-project-ref.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 4: Configure Environment Variables

1. In your project root, open the `.env.local` file
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit your actual API keys to version control!

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Configure the following settings:

### Email Settings
- **Enable email confirmations**: Turn this ON for production
- **Enable email change confirmations**: Turn this ON
- **Enable secure email change**: Turn this ON

### URL Configuration
- **Site URL**: `http://localhost:5173` (for development)
- **Redirect URLs**: Add `http://localhost:5173` (for development)

For production, update these URLs to your actual domain.

## Step 6: Configure Storage

1. Go to **Storage** in your Supabase dashboard
2. The `cat-photos` bucket should already be created by the SQL script
3. Verify the bucket policies are in place:
   - Anyone can view photos
   - Authenticated users can upload photos
   - Users can manage their own photos

## Step 7: Test the Setup

1. Start your development server: `npm run dev`
2. Open the application in your browser
3. Try the following:
   - Sign up for a new account
   - Check your email for confirmation (if enabled)
   - Sign in to the application
   - Add a cat report with a photo
   - Verify the data appears in your Supabase dashboard

## Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables" error**
- Make sure your `.env.local` file has the correct variable names
- Restart your development server after adding environment variables

**2. Authentication not working**
- Check that your Site URL and Redirect URLs are configured correctly
- Verify that email confirmations are properly configured

**3. Photos not uploading**
- Check that the `cat-photos` storage bucket exists
- Verify storage policies are correctly set up
- Check browser console for specific error messages

**4. Real-time updates not working**
- Ensure Row Level Security policies are properly configured
- Check that the subscription is properly set up in the code

### Database Verification

You can verify your setup by checking the following in your Supabase dashboard:

1. **Table Editor** > `profiles` - Should be empty initially
2. **Table Editor** > `cats` - Should be empty initially
3. **Storage** > `cat-photos` - Should exist and be public
4. **Authentication** > **Users** - Should show users after they sign up

## Production Deployment

When deploying to production:

1. Update environment variables with production Supabase URL and keys
2. Update authentication URLs to your production domain
3. Consider enabling additional security features:
   - Email confirmations
   - Rate limiting
   - Additional RLS policies if needed

## Security Notes

- The anon key is safe to use in client-side code
- Row Level Security (RLS) is enabled to protect user data
- Users can only modify their own cat reports
- All cat reports are publicly viewable (by design for community use)

## Support

If you encounter issues:
1. Check the Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
2. Review the browser console for error messages
3. Check the Supabase dashboard logs
4. Ensure all SQL commands from `supabase-setup.sql` executed successfully
