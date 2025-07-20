-- migrate:up
-- Organization info
create materialized view if not exists deident_public.organization_info as 
select * from public.organization_info;

create materialized view if not exists deident_public.suborganizations as
select * from public.suborganizations;

create materialized view if not exists deident_public.mapped_events as
SELECT 
    um.user_did as user_id,
    me.organization,
	me.event_timestamp_pst,
	me.event_type,
	me.event,
	me.event_id,
	me.product,
	me.product_category,
	me.feature,
	me.event_category,
	me.is_high_impact,
	me.newfeature_product,
	me.fs_product_category,
	me.platform,
	me.action_type,
	me.target_id,
	me.target_type,
	me.screen_name,
	me.screen_id,
	me.screen_page,
	me.feature_old,
	me.product_old,
	me.product_category_old,
	me.fs_product_category_old,
	me.ext_product,
	me.ext_fs_product_category
FROM public.mapped_events me
inner join fq_foodapp_tenants.users_mapping um
 on me.user_id = um.user_id;
-- migrate:down

drop materialized view if exists deident_public.organization_info;
drop materialized view if exists deident_public.suborganizations;
drop materialized view if exists deident_public.mapped_events;