-- Private bucket for Commercial Analysis borrower documents.
-- Never made public; access is only ever via short-expiry signed URLs
-- (see src/lib/storage.ts). Files are stored under `${auth.uid()}/...`
-- so the RLS policies below can key off the path prefix.
insert into storage.buckets (id, name, public)
values ('commercial-documents', 'commercial-documents', false)
on conflict (id) do nothing;

create policy "own commercial docs read"
  on storage.objects for select
  using (
    bucket_id = 'commercial-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own commercial docs write"
  on storage.objects for insert
  with check (
    bucket_id = 'commercial-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own commercial docs delete"
  on storage.objects for delete
  using (
    bucket_id = 'commercial-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
