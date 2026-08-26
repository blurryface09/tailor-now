-- Wires up the two referral rewards that previously only existed as UI copy:
--   1. Refer a creative -> ₦2,000 once they complete 3 orders as a tailor.
--   2. Refer your own client (already handled in app code via
--      checkReferralWaiver/consumeReferralWaiver in src/lib/payments.ts) ->
--      commission waived on their first order with you.
-- Adds a column both paths write to so the /referral page can show a real
-- "Earned" total instead of a hardcoded 0.
-- Run this once in the Supabase SQL editor.

alter table public.referrals add column if not exists reward_amount numeric not null default 0;

create or replace function public.handle_order_completed_referral_bonus()
returns trigger as $$
declare
  tailor_user_id uuid;
  ref record;
begin
  if new.status <> 'completed' or old.status = 'completed' then
    return new;
  end if;

  select user_id into tailor_user_id
  from public.tailor_profiles
  where id = new.tailor_id;

  if tailor_user_id is null then
    return new;
  end if;

  select * into ref
  from public.referrals
  where referred_id = tailor_user_id
    and status = 'pending'
  limit 1;

  if ref.id is null then
    return new;
  end if;

  update public.referrals
  set orders_completed = orders_completed + 1
  where id = ref.id
  returning * into ref;

  if ref.orders_completed >= 3 and not ref.bonus_paid then
    update public.referrals
    set status = 'rewarded', bonus_paid = true, reward_amount = 2000
    where id = ref.id;

    update public.profiles
    set wallet_balance = coalesce(wallet_balance, 0) + 2000
    where id = ref.referrer_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_order_completed_referral_bonus on public.orders;
create trigger on_order_completed_referral_bonus
  after update on public.orders
  for each row execute function public.handle_order_completed_referral_bonus();
