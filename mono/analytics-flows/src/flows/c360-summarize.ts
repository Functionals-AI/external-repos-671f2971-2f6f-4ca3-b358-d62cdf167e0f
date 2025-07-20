import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '5 15 * * ? *',
    startAt: 'EligibilityPerson',
    states: {
      EligibilityPerson: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.eligibility_person;
          CREATE TABLE c360.eligibility_person AS 
          SELECT 
            id AS eligibility_id, 
            member_id_2 AS healthplan_id,
            '' AS employee_id,
            '' AS channel_partner_id,
            subscriber_id, 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            CASE WHEN plan_type = 'State' THEN 'Medicaid' ELSE plan_type END AS lob,
            'Healthplan' AS org_type,
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id = 8  
          UNION ALL

          ------CDPHP
          SELECT 	
            id, 
            replace(member_id_2,'\r',''), 
            '', 
            replace(person_id,'\r',''), 
            subscriber_id , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            lob,
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id = 14 AND suborganization_id IN ('9027b68c-521f-4e3f-8d1a-b9f5a3ddbbd4','4247f009-b427-4146-9c79-e0f0fc444706','ca1642b5-4182-40de-99db-b37a4a81b5b2','b8308d08-bd57-4b4c-971e-1f52811a062a')
          UNION ALL 

          ------CCHP Mediciad
          SELECT 	
            id, 
            person_id, 
            '', 
            '', 
            member_id_2 , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            CASE WHEN member_id_2 IS NOT NULL THEN True ELSE False END, 
            number_in_household, 
            'Medicaid',
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id = 174
          UNION ALL 

          ------CCHP Commercial
          SELECT 	
            id, 
            person_id, 
            '', 
            '', 
            member_id_2 , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            CASE WHEN member_id_2 IS NOT NULL THEN True ELSE False END, 
            number_in_household, 
            'Commercial',
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id = 175
          UNION ALL 


          ----Dean (and other dean plans)
          SELECT 	
            id, 
            person_id, 
            '', 
            '', 
            '' , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Commercial',
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id IN (151,150,149)
          UNION ALL

          ------UmpQua AND Healthfirst
          SELECT 	
            id, 
            person_id, 
            '', 
            '', 
            '' , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Medicaid',
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id IN(183,184)
          UNION ALL


          ------AAH
          SELECT 	
            id, 
            '', 
            person_id, 
            '', 
            '' , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Employee',
            'Employer',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id = 182
          UNION ALL 

          ------MPGA AND Aetna Medicare AND Florida Blue Medicare

          SELECT 	
            id, 
            person_id, 
            '', 
            '', 
            member_id_2 , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Medicare',
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id IN (177,170,169)
          UNION ALL 

          ------Pacific Source AND Cigna AND Harvard Pilgrim AND M&T
          SELECT 	
            id, 
            person_id, 
            '', 
            '', 
            member_id_2 , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Commercial',
            'Healthplan',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id IN (172,171,163,146 )
          UNION ALL 

          ------Stantec AND Dassault OLD
          SELECT 	
            id, 
            member_id_2, 
            '', 
            person_id, 
            '' , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Employee',
            'Employer',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id IN (145,85)
          UNION ALL 

          ------CU Health
          SELECT 	
            id, 
            '', 
            person_id, 
            '', 
            '' , 
            group_number, 
            email, 
            organization_id, 
            suborganization_id, 
            zip_code, 
            birthday, 
            gender, 
            is_dependent, 
            number_in_household, 
            'Employee',
            'Employer',
            firstname,
            lastname,
            address,
            city,
            state,
            mobile_phone
          FROM foodapp_stage.go_users_eligible_raw
          WHERE organization_id IN (131,132);
          COMMIT TRANSACTION;
        `,
        next: 'FoodsmartUser',
      }),
      FoodsmartUser: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.foodsmart_user;
          CREATE TABLE c360.foodsmart_user AS 
          ------Independent Health
            SELECT 
              id AS fs_id, 
              eligible_id,
              member_id_2 AS healthplan_id,
              '' AS employee_id,
              '' AS channel_partner_id,	 
              email, 
              organization_id, 
              suborganization_id, 	 
              gender, 
              'Healthplan' AS org_type,
              firstname,
              lastname,
              create_date AS fs_app_enrollment_date,
              last_login_date 
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 8  
            UNION ALL

	----Salesforce

	SELECT 
		id,
		eligible_id,
		UPPER(TRIM(' ' FROM TRIM('-' FROM member_id))),
		'',
		'',
		email,
		organization_id,
		suborganization_id,
		gender,
		'Employer',
		firstname,
		lastname,
		create_date,
		last_login_date
	FROM 
		foodapp_stage.go_users_raw
	WHERE organization_id = 173 
	UNION ALL 

            ------CIGNA COMPANIES
            SELECT 
              id AS fs_id, 
              eligible_id,
              member_id_2 AS healthplan_id,
              member_id AS employee_id,
              '' AS channel_partner_id, 
              email, 
              organization_id, 
              suborganization_id, 
              gender, 

              'Employer' AS org_type,
              firstname,
              lastname,
              create_date,
              last_login_date 
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 47 
            UNION ALL

            ------CDPHP
            SELECT 	
              id, 
              eligible_id,
              replace(member_id_2,'\r',''), 
              '', 
              replace(member_id,'\r',''), 
              email, 
              organization_id, 
              suborganization_id, 
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 14 AND suborganization_id IN ('9027b68c-521f-4e3f-8d1a-b9f5a3ddbbd4','4247f009-b427-4146-9c79-e0f0fc444706','ca1642b5-4182-40de-99db-b37a4a81b5b2','b8308d08-bd57-4b4c-971e-1f52811a062a')
            UNION ALL 

            ------CCHP Mediciad
            SELECT 	
              id, 
              eligible_id,
              member_id, 
              '', 
              '', 
              email, 
              organization_id, 
              suborganization_id, 
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date	
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 174
            UNION ALL 

            ------CCHP Commercial
            SELECT 	
              id,
              eligible_id, 
              member_id, 
              '', 
              '', 
              email, 
              organization_id, 
              suborganization_id,  
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 175
            UNION ALL 


            ----Dean (and other dean plans)
            SELECT 	
              id, 
              eligible_id,
              member_id, 
              '', 
              '',  
              email, 
              organization_id, 
              suborganization_id, 	 
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date	
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN (151,150,149)
            UNION ALL

            ------UmpQua AND Healthfirst
            SELECT 	
              id, 
              eligible_id,
              member_id, 
              '', 
              '', 
              email, 
              organization_id, 
              suborganization_id, 
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN(183,184)
            UNION ALL


            ------AAH
            SELECT 	
              id, 
              eligible_id,
              '', 
              member_id, 
              '', 
              email, 
              organization_id, 
              suborganization_id,  
              gender, 
              'Employer',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 182
            UNION ALL 

            ------MPGA AND Aetna Medicare AND Florida Blue Medicare

            SELECT 	
              id, 
              eligible_id,
              member_id, 
              '', 
              '', 
              email, 
              organization_id, 
              suborganization_id, 
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date	
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN (177,170,169)
            UNION ALL 

            ------Pacific Source AND Cigna AND Harvard Pilgrim AND M&T
            SELECT 	
              id, 
              eligible_id,
              member_id, 
              '', 
              '', 
              email, 
              organization_id, 
              suborganization_id, 	 	 
              gender, 
              'Healthplan',
              firstname,
              lastname,
              create_date,
              last_login_date	
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN (172,163,146 )
            UNION ALL  


            --CIGNA Companies
            SELECT 	
              id, 
              eligible_id,
              member_id_2, 
              member_id, 
              '', 
              email, 
              organization_id, 
              suborganization_id, 	 	 
              gender, 
              'Employer',
              firstname,
              lastname,
              create_date,
              last_login_date	
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 171
            UNION ALL  

            ---Other SSO
            SELECT 	
              id, 
              eligible_id,
              '', 
              '', 
              member_id, 
              email, 
              organization_id, 
              suborganization_id, 	 	 
              gender, 
              'Employer',
              firstname,
              lastname,
              create_date,
              last_login_date	
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN(41,52,133)
            UNION ALL  


            ------Stantec AND Dassault OLD
            SELECT 	
              id,
              eligible_id, 
              member_id_2, 
              '', 
              member_id, 	 
              email, 
              organization_id, 
              suborganization_id, 	 
              gender, 
              'Employer',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN (145,85)
            UNION ALL 

            ------CU Health
            SELECT 	
              id, 
              eligible_id,
              '', 
              member_id, 
              '',
              email, 
              organization_id, 
              suborganization_id, 	 
              gender, 
              'Employer',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id IN (131,132)
            UNION ALL 

            --- VP + Accounts 
            SELECT 	
              id, 
              eligible_id,
              '', 
              member_id_2, 
              member_id,  
              email, 
              organization_id, 
              suborganization_id, 
              gender, 
              'Employer',
              firstname,
              lastname,
              create_date,
              last_login_date
            FROM foodapp_stage.go_users_raw
            WHERE organization_id = 10 ;
          COMMIT TRANSACTION;
        `,
        next: 'AthenaPatient',
      }),
      AthenaPatient: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.athena_patient;
          CREATE TABLE c360.athena_patient AS SELECT 
            p.patientid,
            p.firstname,
            p.lastname,
            p.email,
            p.mobilephone,
            p.patienthomephone,
            p.address,
            p.address2,
            p.city,
            p.state,
            p.zip,
            p.dob,
      	    p.race,
      	    p.ethnicity,
	    p.sex,
	    p.language,
            pi.policyidnumber,
            pi.policygroupnumber,
            i.superpackagename,
            i.name AS insurance_package_name,
            i.adjudicationprogramid,
            s.special_program,
            c.program,
            csd.program_start_date,
	    rwd.send_reward_via_mail
          FROM athena_stage.patient_raw p
          JOIN ( SELECT insr.patientid, insr.policyidnumber,insr.policygroupnumber,insr.insurancepackageid 
          		 FROM athena_stage.patientinsurance_raw insr
          		 inner join (
		    		select r.patientid, max(lastupdated) as MaxDate
		    		from athena_stage.patientinsurance_raw r
		    		group by 1
			) tm on insr.patientid = tm.patientid and insr.lastupdated = tm.MaxDate ) AS pi ON pi.patientid = p.patientid
          JOIN athena_stage.insurancepackage_raw i ON i.insurancepackageid = pi.insurancepackageid
          LEFT JOIN (
              SELECT patientid, customfieldvalue AS special_program  
              FROM athena_stage.customdemographics_raw 
              WHERE customfieldname = 'Special Programs') s ON s.patientid = p.patientid
          LEFT JOIN  (
              SELECT
                patientid, 
                customfieldvalue AS program 
              FROM  athena_stage.customdemographics_raw 
              WHERE customfieldname = 'Program'
            ) AS c ON c.patientid = p.patientid
          LEFT JOIN (
              SELECT
                patientid, 
                customfieldvalue AS program_start_date  
              FROM  athena_stage.customdemographics_raw 
              WHERE customfieldname = 'Program Registration Start Date'
            ) AS csd ON csd.patientid = p.patientid
	   LEFT JOIN (
              SELECT
                patientid, 
                customfieldvalue AS send_reward_via_mail  
              FROM  athena_stage.customdemographics_raw 
              WHERE customfieldname = 'Send reward via mail'
            ) AS rwd ON rwd.patientid = p.patientid;
          COMMIT TRANSACTION;
        `,
        next: 'SchedulingUser',
      }),
      SchedulingUser: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.scheduling_user;
          CREATE TABLE c360.scheduling_user AS 
          with n AS (
              SELECT t.*,
              MAX(CASE WHEN event_name = 'personal_info_form_page_2_submission' THEN 1 ELSE 0 END) OVER (PARTITION BY session_id)  as info
              FROM analytics.scheduling_flow_events t),
            c AS (	
            SELECT e.data , ev.event_name, ev.session_id, ev.member_id,ev.patient_id,ev.employer_id,ev.group_id,ev.employer_name,ev.insurance_name,ev.tn_app_user_id, DATE_TRUNC('day',ev.timestamp) AS date
            from analytics.events e
            LEFT JOIN analytics.scheduling_flow_events ev ON e.id = ev.id
            WHERE e.id IN
              (SELECT n.id AS date FROM n 
              WHERE info = 1  AND event_name IN ('personal_info_form_page_2_submission','personal_info_form_page_1_submission','book-appointment'))
              )

            SELECT DISTINCT 
              c.member_id,
              c.patient_id,
              c.employer_id,
              c.group_id,
              c.employer_name,
              c.insurance_name,
              c.tn_app_user_id,
              a.first_name,
              a.last_name,
              a.dob,
              a.sex,
              b.email,
              b.phone_home,
              b.phone_mobile,
              b.address,
              b.city,
              b.state,
              b.zipcode
            FROM c
            LEFT JOIN ( SELECT session_id, date, data.first_name, data.last_name, data.dob, data.sex FROM c WHERE event_name = 'personal_info_form_page_1_submission') AS a on a.session_id = c.session_id
            LEFT JOIN ( SELECT session_id, data.email, data.phone_home, data.phone_mobile, data.address, data.city, data.state, data.zipcode FROM c WHERE event_name = 'personal_info_form_page_2_submission') AS b on b.session_id = c.session_id;
          COMMIT TRANSACTION;
        `,
        next: 'C360Summary',
      }),
      C360Summary: Redshift.query({
        sql: `
          BEGIN TRANSACTION;
          DROP TABLE IF EXISTS c360.summary;
          CREATE TABLE c360.summary AS 
          with eu AS (
            SELECT 
              e.eligibility_id AS elg_eligibility_id,
              e.healthplan_id AS elg_healthplan_id,
              e.employee_id AS elg_employee_id,
              e.channel_partner_id AS elg_channel_partner_id,
              e.subscriber_id AS elg_subscriber_id,
              e.group_number AS elg_group_number,
              e.email AS elg_email,
              e.organization_id AS elg_organization_id,
              e.suborganization_id AS elg_suborganization_id,
              e.zip_code AS elg_zip_code,
              e.birthday AS elg_birthday,
              e.gender AS elg_gender,
              e.is_dependent AS elg_is_dependent,
              e.number_in_household AS elg_number_in_household,
              e.lob AS elg_lob,
              e.org_type AS elg_org_type,
              e.firstname AS elg_firstname,
              e.lastname AS elg_lastname,
              e.address AS elg_address,
              e.city AS elg_city,
              e.state AS elg_state,
              e.mobile_phone AS elg_mobile_phone,
              u.fs_id AS fsapp_fs_id,
              u.eligible_id AS fsapp_eligible_id,
              u.healthplan_id AS fsapp_healthplan_id,
              u.employee_id AS fsapp_employee_id,
              u.channel_partner_id AS fsapp_channel_partner_id,
              u.email AS fsapp_email,
              u.organization_id AS fsapp_organization_id,
              u.suborganization_id AS fsapp_suborganization_id,
              u.gender AS fsapp_gender,
              u.org_type AS fsapp_org_type,
              u.firstname AS fsapp_firstname,
              u.lastname AS fsapp_lastname,
              u.fs_app_enrollment_date AS fsapp_fs_app_enrollment_date,
              u.last_login_date AS fsapp_last_login_date
            FROM c360.eligibility_person e 
            FULL JOIN c360.foodsmart_user u ON u.eligible_id = e.eligibility_id
          ),

          tn_hp AS (
            SELECT * FROM c360.athena_patient 
            WHERE policyidnumber IS NOT NULL
          ),

          tn_sp AS (SELECT * FROM  c360.athena_patient 
            WHERE policyidnumber IS  NULL
            )


          SELECT 
             elg_eligibility_id,
             elg_healthplan_id,
             elg_employee_id,
             elg_channel_partner_id,
             elg_subscriber_id,
             elg_group_number,
             elg_email,
             elg_organization_id,
             elg_suborganization_id,
             elg_zip_code,
             elg_birthday,
             elg_gender,
             elg_is_dependent,
             elg_number_in_household,
             elg_lob,
             elg_org_type,
             elg_firstname,
             elg_lastname,
             elg_address,
             elg_city,
             elg_state,
             elg_mobile_phone,
             fsapp_fs_id,
             fsapp_eligible_id,
             fsapp_healthplan_id,
             fsapp_employee_id,
             fsapp_channel_partner_id,
             fsapp_email,
             fsapp_organization_id,
             fsapp_suborganization_id,
             fsapp_gender,
             fsapp_org_type,
             fsapp_firstname,
             fsapp_lastname,
             fsapp_fs_app_enrollment_date,
             fsapp_last_login_date,
             COALESCE(h.patientid, e.patientid) AS tn_patientid,
            COALESCE(h.firstname, e.firstname) AS tn_firstname,
            COALESCE(h.lastname, e.lastname) AS tn_lastname,
            COALESCE(h.email, e.email) AS tn_email,
            COALESCE(h.mobilephone, e.mobilephone) AS tn_mobilephone,
            COALESCE(h.patienthomephone, e.patienthomephone) AS tn_patienthomephone,
            COALESCE(h.address, e.address) AS tn_address,
            COALESCE(h.address2, e.address2) AS tn_address2,
            COALESCE(h.city, e.city) AS tn_city,
            COALESCE(h.state, e.state) AS tn_state,
            COALESCE(h.zip, e.zip) AS tn_zip,
	    COALESCE(h.dob,e.dob) AS tn_dob,
      	    COALESCE(h.race, e.race) AS tn_race,
	    COALESCE(h.sex, e.sex) AS tn_sex,
	    COALESCE(h.language, e.language) AS tn_language,
       	    COALESCE(h.ethnicity, e.ethnicity) AS tn_ethnicity,
            COALESCE(h.policyidnumber, e.policyidnumber) AS tn_policyidnumber,
            COALESCE(h.policygroupnumber, e.policygroupnumber) AS tn_policygroupnumber,
            COALESCE(h.superpackagename, e.superpackagename) AS tn_superpackagename,
            COALESCE(h.insurance_package_name, e.insurance_package_name) AS tn_insurance_package_name,
            COALESCE(h.adjudicationprogramid, e.adjudicationprogramid) AS tn_adjudicationprogramid,
            COALESCE(h.special_program, e.special_program) AS tn_special_program,
            COALESCE(h.program, e.program) AS tn_program,
            COALESCE(h.program_start_date, e.program_start_date) AS tn_curriculum_start_date,
	    COALESCE(h.send_reward_via_mail, e.send_reward_via_mail) AS tn_send_reward_via_mail
          FROM eu
          FULL JOIN tn_hp h ON h.policyidnumber = eu.elg_healthplan_id 
          FULL JOIN tn_sp e ON e.email = eu.fsapp_email;
          COMMIT TRANSACTION;
        `,
      }),
    }
  }
})
