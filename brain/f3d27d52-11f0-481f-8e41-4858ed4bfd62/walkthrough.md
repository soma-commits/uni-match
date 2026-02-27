# Project Initialization Walkthrough

## Completed Steps
1.  **Next.js App Creation**: Initialized `uni-match` with App Router, TypeScript, and ESLint.
2.  **Architecture**: Set up `lib/supabase` for client/server Supabase instances.
3.  **Styling**: Configured `globals.css` with CSS variables and a modern reset (Vanilla CSS).
4.  **Database**: Defined `supabase_schema.sql` with tables for Users, Universities, Boards, etc.

## Setup Instructions
To continue, you need to set up your Supabase project.

### 1. Database Setup
Copy the contents of `supabase_schema.sql` and run it in your Supabase SQL Editor.

### 2. Environment Variables
Create a file named `.env.local` in the root of `uni-match` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Locally
```bash
npm run dev
```
