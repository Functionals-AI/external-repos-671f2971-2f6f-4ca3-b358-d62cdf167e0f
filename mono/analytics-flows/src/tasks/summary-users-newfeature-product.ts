import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
    	DROP TABLE IF EXISTS public.summary_users_newfeature_product;

        CREATE TABLE public.summary_users_newfeature_product AS
        SELECT user_id,  
               min(event_timestamp_pst) as min_event_timestamp,
               max(event_timestamp_pst) as max_event_timestamp,
	       sum(CASE WHEN newfeature_product='Deals' THEN 1 ELSE 0 END ) AS "Deals",
	       sum(CASE WHEN newfeature_product='Cookbook' THEN 1 ELSE 0 END ) AS "Cookbook",
	       sum(CASE WHEN newfeature_product='Biometrics' THEN 1 ELSE 0 END ) AS "Biometrics",
	       sum(CASE WHEN newfeature_product='Food Preferences' THEN 1 ELSE 0 END ) AS "Food Preferences",
	       sum(CASE WHEN newfeature_product='Rewards' THEN 1 ELSE 0 END ) AS "Rewards",
	       sum(CASE WHEN newfeature_product='CookItNow' THEN 1 ELSE 0 END ) AS "CookItNow",
	       sum(CASE WHEN newfeature_product='NutriQuiz' THEN 1 ELSE 0 END ) AS "NutriQuiz",
	       sum(CASE WHEN newfeature_product='Grocery List' THEN 1 ELSE 0 END ) AS "Grocery List",
	       sum(CASE WHEN newfeature_product='Recipes' THEN 1 ELSE 0 END ) AS "Recipes",
	       sum(CASE WHEN newfeature_product='Homepage' THEN 1 ELSE 0 END ) AS "Homepage",
	       sum(CASE WHEN newfeature_product='MyCafé' THEN 1 ELSE 0 END ) AS "MyCafé",
	       sum(CASE WHEN newfeature_product='Meal Kits' THEN 1 ELSE 0 END ) AS "Meal Kits",
	       sum(CASE WHEN newfeature_product='Meal Planner' THEN 1 ELSE 0 END ) AS "Meal Planner",
	       sum(CASE WHEN newfeature_product='Restaurant Guidance' THEN 1 ELSE 0 END ) AS "Restaurant Guidance",
	       sum(CASE WHEN newfeature_product='Restaurant Ordering' THEN 1 ELSE 0 END ) AS "Restaurant Ordering",
	       sum(CASE WHEN newfeature_product='Grocery Ordering' THEN 1 ELSE 0 END ) AS "Grocery Ordering",
               count(distinct newfeature_product) AS "2019 Features used",
               sum(CASE WHEN fs_product_category='Blog Category'  THEN 1 ELSE 0 END ) AS "Blog - Category",
               sum(CASE WHEN fs_product_category='Email Category'  THEN 1 ELSE 0 END ) AS "Email - Category",
               sum(CASE WHEN fs_product_category='FoodSmart'  THEN 1 ELSE 0 END ) AS "FoodSmart",
               sum(CASE WHEN fs_product_category='FoodsMart - Retail'  THEN 1 ELSE 0 END ) AS "FoodsMart - Retail",
               sum(CASE WHEN fs_product_category='FoodsMart - Home'  THEN 1 ELSE 0 END ) AS "FoodsMart - Home",
               sum(CASE WHEN fs_product_category='MyCafé'  THEN 1 ELSE 0 END ) AS "MyCafé - Category",
               sum(CASE WHEN fs_product_category='Homepage/Routing'  THEN 1 ELSE 0 END ) AS "Homepage/Routing - Category",
               sum(CASE WHEN fs_product_category='Telenutrition'  THEN 1 ELSE 0 END ) AS "Telenutrition - Category"
        FROM mapped_events 
        GROUP BY user_id;

    `
  })
}
