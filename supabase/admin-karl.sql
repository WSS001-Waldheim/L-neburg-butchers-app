-- Grant Karl admin on project hnhmfnundobuarvfbaae.
-- Paste into the Supabase SQL editor and run once.
-- This does not create a user and does not set a password.
-- Karl chooses his password on https://luneburg-shop.vercel.app/admin.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    case
      when lower(new.email) = 'karl@wssfarming.co.za' then 'admin'
      else 'customer'
    end,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'customer'), '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = case
      when lower(excluded.email) = 'karl@wssfarming.co.za' then 'admin'
      else public.profiles.role
    end;
  return new;
end;
$$;

-- If he has already signed in, upgrade that profile now.
update public.profiles
set role = 'admin'
where lower(email) = 'karl@wssfarming.co.za';
