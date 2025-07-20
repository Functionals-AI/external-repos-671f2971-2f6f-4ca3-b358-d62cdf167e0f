import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
    	DROP TABLE IF EXISTS public.summary_users_product_total;
	CREATE TABLE public.summary_users_product_total AS
        SELECT user_id,  
	    sum(CASE WHEN product='Goals' THEN 1 ELSE 0 END ) AS "Goals",
	    sum(CASE WHEN product='Food@Home' THEN 1 ELSE 0 END ) AS "Food@Home",
	    sum(CASE WHEN product='Meal Planner' THEN 1 ELSE 0 END ) AS "Meal Planner",
	    sum(CASE WHEN product='Onboarding' THEN 1 ELSE 0 END ) AS "Onboarding",
	    sum(CASE WHEN product='OrderWell' THEN 1 ELSE 0 END ) AS "OrderWell",
	    sum(CASE WHEN product='Rewards' THEN 1 ELSE 0 END ) AS "Rewards",
	    sum(CASE WHEN product='Grocery List' THEN 1 ELSE 0 END ) AS "Grocery List",
	    sum(CASE WHEN product='Cooking' THEN 1 ELSE 0 END ) AS "Cooking",
	    sum(CASE WHEN product='FFQ' THEN 1 ELSE 0 END ) AS "FFQ",
	    sum(CASE WHEN product='Dependents' THEN 1 ELSE 0 END ) AS "Dependents",
	    sum(CASE WHEN product='Homepage' THEN 1 ELSE 0 END ) AS "Homepage",
	    sum(CASE WHEN product='Easy Meals' THEN 1 ELSE 0 END ) AS "Easy Meals",
	    sum(CASE WHEN product='Personalized Insights' THEN 1 ELSE 0 END ) AS "Personalized Insights",
	    sum(CASE WHEN product='CookItNow' THEN 1 ELSE 0 END ) AS "CookItNow",
	    sum(CASE WHEN product='Deals' THEN 1 ELSE 0 END ) AS "Deals",
	    sum(CASE WHEN product='Biometrics' THEN 1 ELSE 0 END ) AS "Biometrics",
	    sum(CASE WHEN product='Login/Signup' THEN 1 ELSE 0 END ) AS "Login/Signup",
	    sum(CASE WHEN product='Surveys' THEN 1 ELSE 0 END ) AS "Surveys",
	    sum(CASE WHEN product='Meal Kits' THEN 1 ELSE 0 END ) AS "Meal Kits",
	    sum(CASE WHEN product='Navigation' THEN 1 ELSE 0 END ) AS "Navigation",
	    sum(CASE WHEN product='Wishlist' THEN 1 ELSE 0 END ) AS "Wishlist",
	    sum(CASE WHEN product='FS Intake' THEN 1 ELSE 0 END ) AS "FS Intake",
	    sum(CASE WHEN product='Cafe Coach' THEN 1 ELSE 0 END ) AS "Cafe Coach",
	    sum(CASE WHEN product='Favorites' THEN 1 ELSE 0 END ) AS "Favorites",
	    sum(CASE WHEN product='Recipes' THEN 1 ELSE 0 END ) AS "Recipes",
	    sum(CASE WHEN product='Food Preferences' THEN 1 ELSE 0 END ) AS "Food Preferences",
	    sum(CASE WHEN product='Email Content' THEN 1 ELSE 0 END ) AS "Email Content",
	    sum(CASE WHEN product='Food Ordering' THEN 1 ELSE 0 END ) AS "Food Ordering",
	    sum(CASE WHEN product='Health Coaching' THEN 1 ELSE 0 END ) AS "Health Coaching"
        FROM mapped_events 
        GROUP BY user_id;
    `
  })
}
