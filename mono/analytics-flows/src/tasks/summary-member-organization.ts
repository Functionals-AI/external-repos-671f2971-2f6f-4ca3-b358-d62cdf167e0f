import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
BEGIN TRANSACTION;

drop table if exists public.summary_member_organization;

create table public.summary_member_organization DISTSTYLE ALL SORTKEY(member_org_id) AS 
	WITH member_organization_internal AS (SELECT
		    (o.organization_id || '/' || nvl(so.suborganization_id, ''))::varchar(65535) AS member_org_id,
		    o.organization_id,
		    so.suborganization_id,
		    o.name AS org_name,
		    so.name AS suborg_name,
		    -- o.landing_page,
		    so.icon_url,
		    CASE WHEN o.is_searchable = TRUE THEN 1 ELSE 0 END as org_searchable,
		    CASE WHEN so.is_searchable = TRUE THEN 1 ELSE 0 END as suborg_searchable,
		    o.eligible_active
		    -- so.subdomain
		  FROM foodapp.organizations  o
		  LEFT JOIN foodapp.suborganizations so
		  ON o.organization_id = so.organization_id
                  UNION ALL
                  SELECT '163/',163,NULL,'Harvard Pilgrim',NULL,NULL,1,1,1
                  UNION ALL
                  SELECT '10/',10,'','Virgin Pulse',NULL,NULL,1,1,1
	    )
	SELECT 
		member_organization_internal.member_org_id AS member_org_id,
		member_organization_internal.organization_id AS organization_id,
		member_organization_internal.suborganization_id AS suborganization_id,
		case
		  when member_organization_internal.org_name = 'ACES Nation' THEN ('ACES: ' || member_organization_internal.suborg_name)
		  when member_organization_internal.org_name = 'BCBS SC' then 'Southeastern Grocers'
		  when member_organization_internal.org_name like 'Optum%' then 'Optum'
		  when (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33')) then 'PG&E'
		  when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) THEN member_organization_internal.org_name
		  else coalesce(member_organization_internal.suborg_name,member_organization_internal.org_name)
		 end::varchar(4000)
		  AS member_org_name,
		case when (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33')) THEN 'PG&E - ' || member_organization_internal.suborg_name
		      when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) THEN (member_organization_internal.org_name || ' - ' || member_organization_internal.suborg_name) end::varchar(255) AS member_org_segment,
		member_organization_internal.org_name AS org_name,
		member_organization_internal.suborg_name AS suborg_name,
		CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	     AS channel_partner_name,
		CASE
		  WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) in (
		    'Jiff',
		    'Provant',
		    'Health Advocate',
		    'Welltok',
		    'Virgin Pulse',
		    'Staywell',
		    'Limeade',
		    'Castlight Health'
		    ) then 'Wellness Platform'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) in ('United Health Group', 'Aetna', 'Rally', 'Cigna', 'Independent Health', 'HCSC') then 'Health Insurance'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) like 'Optum%' then 'Health Insurance'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) like 'BCBS%'then 'Health Insurance'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) in ('Compass') then 'Food Service'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) in ('ACES Nation') then 'Other'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) = '(Direct)' then '(Direct)'
		WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) in ('Ward Health') then 'Global Insurance'
	       ELSE NULL END AS channel_type,
		CASE WHEN (member_organization_internal.eligible_active = 1)  THEN 'Yes' ELSE 'No' END
	 AS has_efile,
		CASE WHEN member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33')) THEN 'Yes' ELSE 'No' END
	 AS has_org_segments
	FROM member_organization_internal
	WHERE 
		NOT COALESCE(case
		  -- demo orgs
		  when member_organization_internal.organization_id in
		    (2,3,4,5,13,16,19,21,25,28,29,30,35,74) then true
		    --      (13,16,19,21,25,28,29,30,35)
		  when member_organization_internal.member_org_id in
		    (
		      '22/cummins',
		      '41/0777785',
		      '43/244471',
		      '43/1043839',
		      '14/adp',
		      '14/chi',
		      '14/centura',
		      '14/hf',
		      '14/hp'
		    ) then TRUE
		  WHEN (case
		  when member_organization_internal.org_name = 'ACES Nation' THEN ('ACES: ' || member_organization_internal.suborg_name)
		  when member_organization_internal.org_name = 'BCBS SC' then 'Southeastern Grocers'
		  when member_organization_internal.org_name like 'Optum%' then 'Optum'
		  when (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33')) then 'PG&E'
		  when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) THEN member_organization_internal.org_name
		  else coalesce(member_organization_internal.suborg_name,member_organization_internal.org_name)
		 end::varchar(4000)) in
		    (
		    'Heb',
		    'Health',
		    'SeeChange',
		    'PitneyBowes',
		    'LinkedIn',
		    'Microsoft',
		    'Bi-Lo/Winne-Dixie',
		    'Amplify' ,
		    'Welltok',
		    'QA',
		    'Comcast',
		    'Sun Life',
		    'Home Depot'
		    ) then true
		  WHEN coalesce(member_organization_internal.suborg_name, member_organization_internal.org_name) LIKE '%Demo%' then true
		  WHEN (CASE
		WHEN org_name = 'Hello Dr.' THEN 'Ward Health'
		-- WHEN org_name = 'Right Bytes' THEN 'UHC'
		WHEN org_name = 'Right Bytes' THEN 'UHC RightBytes' --THEN 'United Health Group'
		WHEN org_name = 'BCBS' THEN 'BCBS SC'
		WHEN org_name like 'BCBS%' then org_name
		--WHEN org_name = 'Optum Wellness Coaching' THEN 'Rally'
		WHEN org_name = 'Optum Wellness Coaching' THEN 'Optum'
		WHEN org_name = 'Jiff' then 'Castlight Health'
		WHEN org_name = 'Changemaker' then 'Limeade'
		WHEN org_name in ('Milliken', 'Johnson & Johnson','Samsung') then 'Compass'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
	--        WHEN org_name in ('Activision Blizzard') then '(Direct)'
		WHEN org_name in ('Jiff', 'Provant', 'Health Advocate', 'Welltok', 'Virgin Pulse','Staywell','Limeade') then org_name
		when (member_organization_internal.org_name IN ('Disney', 'Toys R Us', 'Arconic') OR (member_organization_internal.organization_id = 18 and member_organization_internal.suborganization_id in ('96','34','33'))) then '(Direct)'
	  --      WHEN org_name in ('Aetna') then org_name
		WHEN member_organization_internal.suborganization_id is null then '(Direct)'
		ELSE org_name
	      END::varchar(255)
	) in ('Ward Health') then true
		  else false
		  END
		, FALSE)
            ;
	  COMMIT TRANSACTION;   
`
  })
}