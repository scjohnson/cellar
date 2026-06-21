-- Drop the automatic decrement trigger for tastings
-- The user requested that inventory should not be automatically decremented
-- when a tasting note is logged.

drop trigger if exists tastings_decrement on tastings;
drop function if exists decrement_on_tasting;
