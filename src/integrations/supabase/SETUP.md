# Supabase Storage Setup

## Required Storage Buckets

Run the following SQL in your Supabase SQL editor to create all required storage buckets:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES
  ('status-media', 'status-media', true),
  ('avatars', 'avatars', true),
  ('tournament-images', 'tournament-images', true),
  ('reels', 'reels', true),
  ('messages', 'messages', false)
ON CONFLICT (id) DO NOTHING;
```

## Bucket Policies

After creating the buckets, set up the following RLS policies:

### Public Buckets (status-media, avatars, tournament-images, reels)

- Allow authenticated users to upload
- Allow public read access

### Private Buckets (messages)

- Allow authenticated users to upload their own files
- Allow users to read only their own files

## Usage

Import the bucket constants in your code:

```typescript
import { STORAGE_BUCKETS } from "@/integrations/supabase/storage-setup";

// Upload to status-media bucket
const { data, error } = await supabase.storage
  .from(STORAGE_BUCKETS.STATUS_MEDIA)
  .upload(path, file);
```
