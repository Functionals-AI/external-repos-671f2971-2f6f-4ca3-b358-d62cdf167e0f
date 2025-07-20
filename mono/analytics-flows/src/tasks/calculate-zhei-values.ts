import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
-- Create temporary table, only if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."zhei_user_consume_values_temp" (
  "user_id" int4,
  "date_trunc" timestamp NULL,
  "added sugars" float8,
  "dairy" float8,
  "whole grains" float8,
  "lean protein" float8,
  "calcium" float8,
  "sodium" float8,
  "vegetables" float8,
  "added sugars from sugar sweetened beverages" float8,
  "fruits and vegetables" float8,
  "fruits" float8,
  "fiber" float8,
  "saturated fat" float8,
  "healthy fat" float8,
  "water" float8
)
WITH OIDS;

-- Remove all rows, before inserting data
TRUNCATE TABLE public.zhei_user_consume_values_temp;

-- Insert data into temporary table
-- Get data from hp_ffq_user table.
-- Use "CASE WHEN ..." to pivot table.
-- Format date to "day" format. 
-- Use "GROUP BY" to drop duplicates
INSERT INTO public.zhei_user_consume_values_temp
WITH consume_data AS  
(
  SELECT user_id, DATE_TRUNC('DAY',date), 
  max(CASE WHEN category='added sugars' 
    THEN value
    ELSE null 
    END) AS "added sugars",
  max(CASE WHEN category='dairy' 
    THEN value
    ELSE null 
    END) AS "dairy",
  max(CASE WHEN category='whole grains' 
    THEN value
    ELSE null 
    END) AS "whole grains",
  max(CASE WHEN category='lean protein' 
    THEN value
    ELSE null 
    END) AS "lean protein",
  max(CASE WHEN category='calcium' 
    THEN value
    ELSE null 
    END) AS "calcium",
  max(CASE WHEN category='sodium' 
    THEN value
    ELSE null 
    END) AS "sodium",
  max(CASE WHEN category='vegetables' 
    THEN value
    ELSE null 
    END) AS "vegetables",
  max(CASE WHEN category='added sugars from sugar-sweetened beverages' 
    THEN value
    ELSE null 
    END) AS "added sugars from sugar sweetened beverages",
  max(CASE WHEN category='fruits and vegetables' 
    THEN value
    ELSE null 
    END) AS "fruits and vegetables",
  max(CASE WHEN category='fruits' 
    THEN value
    ELSE null 
    END) AS "fruits",
  max(CASE WHEN category='fiber' 
    THEN value
    ELSE null 
    END) AS "fiber",
  max(CASE WHEN category='saturated fat' 
    THEN value
    ELSE null 
    END) AS "saturated fat",
  max(CASE WHEN category='healthy fat' 
    THEN value
    ELSE null 
    END) AS "healthy fat",
  max(CASE WHEN category='water' 
    THEN value
    ELSE null 
  END) AS "water"
FROM fq_foodapp_tenants.hp_ffq_user
GROUP BY 1,2
)
-- Fill NULL values with previous non-Null value. Equivalent of pandas ffill()
SELECT  user_id, date_trunc, 
  coalesce("added sugars", LAG("added sugars",1) IGNORE NULLS OVER (partition by user_id, added_sugars_group ORDER BY date_trunc ASC)) as "added sugars",
  coalesce(dairy, LAG(dairy,1) IGNORE NULLS OVER (partition by user_id, dairy_group ORDER BY date_trunc ASC)) as dairy,
  coalesce("whole grains", LAG("whole grains",1) IGNORE NULLS OVER (partition by user_id, whole_grains_group ORDER BY date_trunc ASC)) as "whole grains",
  coalesce("lean protein", LAG("lean protein",1) IGNORE NULLS OVER (partition by user_id, lean_protein_group ORDER BY date_trunc ASC)) as "lean protein",
  coalesce(calcium, LAG(calcium,1) IGNORE NULLS OVER (partition by user_id, calcium_group ORDER BY date_trunc ASC)) as calcium,
  coalesce(sodium, LAG(sodium,1) IGNORE NULLS OVER (partition by user_id, sodium_group ORDER BY date_trunc ASC)) as sodium,
  coalesce(vegetables, LAG(vegetables,1) IGNORE NULLS OVER (partition by user_id, vegetables_group ORDER BY date_trunc ASC)) as vegetables,
  coalesce("added sugars from sugar sweetened beverages", LAG("added sugars from sugar sweetened beverages",1) IGNORE NULLS OVER (partition by user_id, added_sugars_from_sugar_sweetened_beverages_group ORDER BY date_trunc ASC)) as "added sugars from sugar sweetened beverages",
  coalesce("fruits and vegetables", LAG("fruits and vegetables",1) IGNORE NULLS OVER (partition by user_id, fruits_and_vegetables_group ORDER BY date_trunc ASC)) as "fruits and vegetables",
  coalesce(fruits, LAG(fruits,1) IGNORE NULLS OVER (partition by user_id, fruits_group ORDER BY date_trunc ASC)) as fruits,
  coalesce(fiber, LAG(fiber,1) IGNORE NULLS OVER (partition by user_id, fiber_group ORDER BY date_trunc ASC)) as fiber,
  coalesce("saturated fat", LAG("saturated fat",1) IGNORE NULLS OVER (partition by user_id, saturated_fat_group ORDER BY date_trunc ASC)) as "saturated fat",
  coalesce("healthy fat", LAG("healthy fat",1) IGNORE NULLS OVER (partition by user_id, healthy_fat_group ORDER BY date_trunc ASC)) as "healthy fat",
  coalesce(water, LAG(water,1) IGNORE NULLS OVER (partition by user_id, water_group ORDER BY date_trunc ASC)) as water
FROM (
  SELECT user_id, date_trunc, 
    "added sugars",
    dairy,
    "whole grains","lean protein",
    calcium,
    sodium,vegetables,
    "added sugars from sugar sweetened beverages","fruits and vegetables",
    fruits,fiber,"saturated fat","healthy fat",water,
    count("added sugars") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as added_sugars_group,
    count(dairy) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as dairy_group,
    count("whole grains") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as whole_grains_group,
    count("lean protein") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as lean_protein_group,
    count(calcium) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as calcium_group,
    count(sodium) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as sodium_group,
    count(vegetables) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as vegetables_group,
    count("added sugars from sugar sweetened beverages") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as added_sugars_from_sugar_sweetened_beverages_group,
    count("fruits and vegetables") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as fruits_and_vegetables_group,
    count(fruits) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as fruits_group,
    count(fiber) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as fiber_group,
    count("saturated fat") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as saturated_fat_group,
    count("healthy fat") OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as healthy_fat_group,
    count(water) OVER (PARTITION BY user_id ORDER BY date_trunc ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as water_group
  FROM consume_data
) sub
;
-- Create temporary table, only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.zhei_user_ffq_values_temp (
  "user_id" int8,
  "response_date" timestamp NULL,
  "cheese" float8,
  "poultry_without_skin" float8,
  "pork" float8,
  "fish" float8,
  "cookies" float8,
  "other_vegetables" float8,
  "green_vegetables" float8,
  "milk_type" varchar(30),
  "milk" float8,
  "salad_dressing_mayo" float8,
  "whole_grain_bread" float8,
  "shellfish" float8,
  "donuts" float8,
  "nuts" float8,
  "caffeine" float8,
  "red_meat" float8,
  "tomato_sauce" float8,
  "pizza" float8,
  "sports_drinks" float8,
  "plant_based_oils" float8,
  "deli" float8,
  "vegetarian_protein" float8,
  "soda" float8,
  "eat_out" float8,
  "whole_grains" float8,
  "chocolate" float8,
  "poultry_with_skin" float8,
  "cereal" float8,
  "salsa" float8,
  "ice_cream" float8,
  "chips" float8,
  "condiments" float8,
  "juice" float8,
  "french_fries" float8,
  "gender" varchar(20),
  "drink_water" float8,
  "fruit" float8,
  "beans" float8,
  "potatoes" float8,
  "popcorn" float8
)
WITH OIDS;

-- Remove all rows, before inserting data
TRUNCATE TABLE public.zhei_user_ffq_values_temp;

-- Insert data into temporary table
-- Get data from hp_ffq_user table.
-- Use "CASE WHEN ..." to pivot table.
-- Format date to "day" format. 
-- Use "GROUP BY" to drop duplicates
-- Use freq_convert lookup table to convert frequency for food intake to decimal values.
INSERT INTO public.zhei_user_ffq_values_temp
WITH a AS -- Get data from survey_response table
(
  SELECT user_id, date_trunc('DAY',response_time) as response_date, question, substring(response,3,length(response)-4) as response,
  FIRST_VALUE(substring(response,3,length(response)-4)) OVER(partition by user_id,date_trunc('DAY',response_time),question ORDER BY response_time ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as "first_response"
  FROM fq_foodapp_tenants.survey_response 
  WHERE question in ('poultry_with_skin', 'poultry_without_skin', 'fish', 'shellfish',
      'nuts', 'vegetarian_protein', 'beans', 'red_meat', 'deli', 'pizza',
      'french_fries', 'pork', 'cheese', 'chocolate', 'donuts', 'cookies',
      'ice_cream', 'salad_dressing_mayo', 'milk_type', 'milk', 'chips',
      'gender', 'plant_based_oils', 'eat_out', 'whole_grain_bread',
      'cereal','beans', 'condiments', 'salsa', 'tomato_sauce', 'chips',
      'popcorn', 'potatoes','fruit', 'green_vegetables',
      'other_vegetables', 'drink_water', 'caffeine','juice', 'milk',
      'soda', 'sports_drinks', 'whole_grains', 'whole_grain_bread')
  AND response<>'[]'
),
b AS 
( 
  SELECT freq, converted_val 
  FROM public.freq_convert 
),
c AS 
(
  SELECT a.user_id, a.response_date, a.question, a.first_response, b.converted_val, a.response
  FROM a
  LEFT JOIN  b ON a.first_response=b.freq
),
d AS
(
  SELECT user_id, response_date,
    max(CASE WHEN question='cheese' 
      THEN  converted_val
      ELSE null 
      END) AS cheese,
    max(CASE WHEN question='poultry_without_skin' 
      THEN  converted_val
      ELSE null 
      END) AS poultry_without_skin,
    max(CASE WHEN question='pork' 
      THEN  converted_val
      ELSE null 
      END) AS pork,
    max(CASE WHEN question='fish' 
      THEN  converted_val
      ELSE null 
      END) AS fish,
    max(CASE WHEN question='cookies' 
      THEN  converted_val
      ELSE null 
      END) AS cookies,
    max(CASE WHEN question='other_vegetables' 
      THEN  converted_val
      ELSE null 
      END) AS other_vegetables,
    max(CASE WHEN question='green_vegetables' 
      THEN  converted_val
      ELSE null 
      END) AS green_vegetables,
    max(CASE WHEN question='milk_type' 
      THEN "first_response" 
      ELSE null 
      END) AS milk_type,
    max(CASE WHEN question='milk' 
      THEN  converted_val
      ELSE null 
      END) AS milk,
max(CASE WHEN question='salad_dressing_mayo' 
   THEN  converted_val
   ELSE null 
   END) AS salad_dressing_mayo,
max(CASE WHEN question='whole_grain_bread' 
   THEN  converted_val
   ELSE null 
   END) AS whole_grain_bread,
max(CASE WHEN question='shellfish' 
   THEN  converted_val
   ELSE null 
   END) AS shellfish,
max(CASE WHEN question='donuts' 
   THEN  converted_val
   ELSE null 
   END) AS donuts,
max(CASE WHEN question='nuts' 
   THEN  converted_val
   ELSE null 
   END) AS nuts,
max(CASE WHEN question='caffeine' 
   THEN  converted_val
   ELSE null 
   END) AS caffeine,
max(CASE WHEN question='red_meat' 
   THEN  converted_val
   ELSE null 
   END) AS red_meat,
max(CASE WHEN question='tomato_sauce' 
   THEN  converted_val
   ELSE null 
   END) AS tomato_sauce,
max(CASE WHEN question='pizza' 
   THEN  converted_val
   ELSE null 
   END) AS pizza,
max(CASE WHEN question='sports_drinks' 
   THEN  converted_val
   ELSE null 
   END) AS sports_drinks,
max(CASE WHEN question='plant_based_oils' 
   THEN  converted_val
   ELSE null 
   END) AS plant_based_oils,
max(CASE WHEN question='deli' 
   THEN  converted_val
   ELSE null 
   END) AS deli,
max(CASE WHEN question='vegetarian_protein' 
   THEN  converted_val
   ELSE null 
   END) AS vegetarian_protein,
max(CASE WHEN question='soda' 
   THEN  converted_val
   ELSE null 
   END) AS soda,
max(CASE WHEN question='eat_out' 
   THEN  converted_val
   ELSE null 
   END) AS eat_out,
max(CASE WHEN question='whole_grains' 
   THEN  converted_val
   ELSE null 
   END) AS whole_grains,
max(CASE WHEN question='chocolate' 
   THEN  converted_val
   ELSE null 
   END) AS chocolate,
max(CASE WHEN question='poultry_with_skin' 
   THEN  converted_val
   ELSE null 
   END) AS poultry_with_skin,
max(CASE WHEN question='cereal' 
   THEN  converted_val
   ELSE null 
   END) AS cereal,
max(CASE WHEN question='salsa' 
   THEN  converted_val
   ELSE null 
   END) AS salsa,
max(CASE WHEN question='ice_cream' 
   THEN  converted_val
   ELSE null 
   END) AS ice_cream,
max(CASE WHEN question='chips' 
   THEN  converted_val
   ELSE null 
   END) AS chips,
max(CASE WHEN question='condiments' 
   THEN  converted_val
   ELSE null 
   END) AS condiments,
max(CASE WHEN question='juice' 
   THEN  converted_val
   ELSE null 
   END) AS juice,
max(CASE WHEN question='french_fries' 
   THEN  converted_val
   ELSE null 
   END) AS french_fries,
max(CASE WHEN question='gender' 
   THEN "first_response" 
   ELSE null 
   END) AS gender,
max(CASE WHEN question='drink_water' 
   THEN  converted_val
   ELSE null 
   END) AS drink_water,
max(CASE WHEN question='fruit' 
   THEN  converted_val
   ELSE null 
   END) AS fruit,
max(CASE WHEN question='beans' 
   THEN  converted_val
   ELSE null 
   END) AS beans,
max(CASE WHEN question='potatoes' 
   THEN  converted_val
   ELSE null 
   END) AS potatoes,
max(CASE WHEN question='popcorn' 
   THEN  converted_val
   ELSE null 
   END) AS popcorn
FROM c  
GROUP BY 1,2
)
-- Fill NULL values with previous non-Null value. Equivalent of pandas ffill()
SELECT  user_id, response_date, 
  coalesce(cheese, LAG(cheese,1 ) IGNORE NULLS OVER (partition by user_id, cheese_group ORDER BY response_date ASC)) as cheese,
  coalesce(poultry_without_skin, LAG(poultry_without_skin,1 ) IGNORE NULLS OVER (partition by user_id, poultry_without_skin_group ORDER BY response_date ASC)) as poultry_without_skin,
  coalesce(pork, LAG(pork,1 ) IGNORE NULLS OVER (partition by user_id, pork_group ORDER BY response_date ASC)) as pork,
  coalesce(fish, LAG(fish,1 ) IGNORE NULLS OVER (partition by user_id, fish_group ORDER BY response_date ASC)) as fish,
  coalesce(cookies, LAG(cookies,1 ) IGNORE NULLS OVER (partition by user_id, cookies_group ORDER BY response_date ASC)) as cookies,
  coalesce(other_vegetables, LAG(other_vegetables,1 ) IGNORE NULLS OVER (partition by user_id, other_vegetables_group ORDER BY response_date ASC)) as other_vegetables,
  coalesce(green_vegetables, LAG(green_vegetables,1 ) IGNORE NULLS OVER (partition by user_id, green_vegetables_group ORDER BY response_date ASC)) as green_vegetables,
  coalesce(milk_type, LAG(milk_type,1 ) IGNORE NULLS OVER (partition by user_id, milk_type_group ORDER BY response_date ASC)) as milk_type,
  coalesce(milk, LAG(milk,1 ) IGNORE NULLS OVER (partition by user_id, milk_group ORDER BY response_date ASC)) as milk,
  coalesce(salad_dressing_mayo, LAG(salad_dressing_mayo,1 ) IGNORE NULLS OVER (partition by user_id, salad_dressing_mayo_group ORDER BY response_date ASC)) as salad_dressing_mayo,
  coalesce(whole_grain_bread, LAG(whole_grain_bread,1 ) IGNORE NULLS OVER (partition by user_id, whole_grain_bread_group ORDER BY response_date ASC)) as whole_grain_bread,
  coalesce(shellfish, LAG(shellfish,1 ) IGNORE NULLS OVER (partition by user_id, shellfish_group ORDER BY response_date ASC)) as shellfish,
  coalesce(donuts, LAG(donuts,1 ) IGNORE NULLS OVER (partition by user_id, donuts_group ORDER BY response_date ASC)) as donuts,
  coalesce(nuts, LAG(nuts,1 ) IGNORE NULLS OVER (partition by user_id, nuts_group ORDER BY response_date ASC)) as nuts,
  coalesce(caffeine, LAG(caffeine,1 ) IGNORE NULLS OVER (partition by user_id, caffeine_group ORDER BY response_date ASC)) as caffeine,
  coalesce(red_meat, LAG(red_meat,1 ) IGNORE NULLS OVER (partition by user_id, red_meat_group ORDER BY response_date ASC)) as red_meat,
  coalesce(tomato_sauce, LAG(tomato_sauce,1 ) IGNORE NULLS OVER (partition by user_id, tomato_sauce_group ORDER BY response_date ASC)) as tomato_sauce,
  coalesce(pizza, LAG(pizza,1 ) IGNORE NULLS OVER (partition by user_id, pizza_group ORDER BY response_date ASC)) as pizza,
  coalesce(sports_drinks, LAG(sports_drinks,1 ) IGNORE NULLS OVER (partition by user_id, sports_drinks_group ORDER BY response_date ASC)) as sports_drinks,
  coalesce(plant_based_oils, LAG(plant_based_oils,1 ) IGNORE NULLS OVER (partition by user_id, plant_based_oils_group ORDER BY response_date ASC)) as plant_based_oils,
  coalesce(deli, LAG(deli,1 ) IGNORE NULLS OVER (partition by user_id, deli_group ORDER BY response_date ASC)) as deli,
  coalesce(vegetarian_protein, LAG(vegetarian_protein,1 ) IGNORE NULLS OVER (partition by user_id, vegetarian_protein_group ORDER BY response_date ASC)) as vegetarian_protein,
  coalesce(soda, LAG(soda,1 ) IGNORE NULLS OVER (partition by user_id, soda_group ORDER BY response_date ASC)) as soda,
  coalesce(eat_out, LAG(eat_out,1 ) IGNORE NULLS OVER (partition by user_id, eat_out_group ORDER BY response_date ASC)) as eat_out,
  coalesce(whole_grains, LAG(whole_grains,1 ) IGNORE NULLS OVER (partition by user_id, whole_grains_group ORDER BY response_date ASC)) as whole_grains,
  coalesce(chocolate, LAG(chocolate,1 ) IGNORE NULLS OVER (partition by user_id, chocolate_group ORDER BY response_date ASC)) as chocolate,
  coalesce(poultry_with_skin, LAG(poultry_with_skin,1 ) IGNORE NULLS OVER (partition by user_id, poultry_with_skin_group ORDER BY response_date ASC)) as poultry_with_skin,
  coalesce(cereal, LAG(cereal,1 ) IGNORE NULLS OVER (partition by user_id, cereal_group ORDER BY response_date ASC)) as cereal,
  coalesce(salsa, LAG(salsa,1 ) IGNORE NULLS OVER (partition by user_id, salsa_group ORDER BY response_date ASC)) as salsa,
  coalesce(ice_cream, LAG(ice_cream,1 ) IGNORE NULLS OVER (partition by user_id, ice_cream_group ORDER BY response_date ASC)) as ice_cream,
  coalesce(chips, LAG(chips,1 ) IGNORE NULLS OVER (partition by user_id, chips_group ORDER BY response_date ASC)) as chips,
  coalesce(condiments, LAG(condiments,1 ) IGNORE NULLS OVER (partition by user_id, condiments_group ORDER BY response_date ASC)) as condiments,
  coalesce(juice, LAG(juice,1 ) IGNORE NULLS OVER (partition by user_id, juice_group ORDER BY response_date ASC)) as juice,
  coalesce(french_fries, LAG(french_fries,1 ) IGNORE NULLS OVER (partition by user_id, french_fries_group ORDER BY response_date ASC)) as french_fries,
  coalesce(gender, LAG(gender,1 ) IGNORE NULLS OVER (partition by user_id, gender_group ORDER BY response_date ASC)) as gender,
  coalesce(drink_water, LAG(drink_water,1 ) IGNORE NULLS OVER (partition by user_id, drink_water_group ORDER BY response_date ASC)) as drink_water,
  coalesce(fruit, LAG(fruit,1 ) IGNORE NULLS OVER (partition by user_id, fruit_group ORDER BY response_date ASC)) as fruit,
  coalesce(beans, LAG(beans,1 ) IGNORE NULLS OVER (partition by user_id, beans_group ORDER BY response_date ASC)) as beans,
  coalesce(potatoes, LAG(potatoes,1 ) IGNORE NULLS OVER (partition by user_id, potatoes_group ORDER BY response_date ASC)) as potatoes,
  coalesce(popcorn, LAG(popcorn,1 ) IGNORE NULLS OVER (partition by user_id, popcorn_group ORDER BY response_date ASC)) as popcorn
FROM (
  SELECT user_id, response_date, cheese, poultry_without_skin, pork, fish, cookies, other_vegetables,
    green_vegetables, milk_type, milk, salad_dressing_mayo, whole_grain_bread, shellfish,
    donuts, nuts, caffeine, red_meat, tomato_sauce, pizza, sports_drinks, plant_based_oils,
    deli, vegetarian_protein, soda, eat_out, whole_grains, chocolate, poultry_with_skin,
    cereal, salsa, ice_cream, chips, condiments, juice, 
    french_fries, drink_water, fruit, potatoes, popcorn,gender,beans,
    count(cheese) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as cheese_group,
    count(poultry_without_skin) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as poultry_without_skin_group,
    count(pork) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as pork_group,
    count(fish) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as fish_group,
    count(cookies) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as cookies_group,
    count(other_vegetables) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as other_vegetables_group,
    count(green_vegetables) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as green_vegetables_group,
    count(milk_type) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as milk_type_group,
    count(milk) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as milk_group,
    count(salad_dressing_mayo) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as salad_dressing_mayo_group,
    count(whole_grain_bread) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as whole_grain_bread_group,
    count(shellfish) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as shellfish_group,
    count(donuts) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as donuts_group,
    count(nuts) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as nuts_group,
    count(caffeine) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as caffeine_group,
    count(red_meat) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as red_meat_group,
    count(tomato_sauce) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as tomato_sauce_group,
    count(pizza) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as pizza_group,
    count(sports_drinks) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as sports_drinks_group,
    count(plant_based_oils) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as plant_based_oils_group,
    count(deli) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as deli_group,
    count(vegetarian_protein) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as vegetarian_protein_group,
    count(soda) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as soda_group,
    count(eat_out) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as eat_out_group,
    count(whole_grains) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as whole_grains_group,
    count(chocolate) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as chocolate_group,
    count(poultry_with_skin) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as poultry_with_skin_group,
    count(cereal) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as cereal_group,
    count(salsa) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as salsa_group,
    count(ice_cream) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as ice_cream_group,
    count(chips) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as chips_group,
    count(condiments) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as condiments_group,
    count(juice) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as juice_group,
    count(french_fries) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as french_fries_group,
    count(gender) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as gender_group,
    count(drink_water) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as drink_water_group,
    count(fruit) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as fruit_group,
    count(beans) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as beans_group,
    count(potatoes) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as potatoes_group,
    count(popcorn) OVER (PARTITION BY user_id ORDER BY response_date ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) as popcorn_group
FROM d
) subquery
;
-- Create zhei_user table, only if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."zhei_user" (
"user_id" int4,
"date" timestamp NULL,
"fruits" float8,
"vegetables" float8,
"carb_ratio" float8,
"protein_ratio" float8,
"fat_ratio" float8,
"sodium" float8,
"hydration" float8,
"imputed" int4,
"total_score" float8
)
WITH OIDS
;

-- Remove all rows, before inserting data
TRUNCATE TABLE public.zhei_user;

-- Merge data from 2 temporay tables using full outer join
-- Calculate values
-- Remove rows with more than 3 Null column values
-- Generate median values for all the columns for full dataset
-- Replace null with median values
-- Calculate total score
-- Insert data into zhei_user table
INSERT INTO public.zhei_user
WITH merge_temp_tab AS (
  SELECT  b.user_id, b.date_trunc,
    a.response_date,
    b.fruits, b.vegetables,a.other_vegetables,a.milk, a.drink_water,
    "added sugars",
    dairy,
    "whole grains","lean protein",
    calcium,
    sodium,
    "added sugars from sugar sweetened beverages","fruits and vegetables",
    fiber,"saturated fat","healthy fat",water,
    cheese, poultry_without_skin, pork, fish, cookies, 
    green_vegetables, milk_type,  salad_dressing_mayo, whole_grain_bread, shellfish,
    donuts, nuts, caffeine, red_meat, tomato_sauce, pizza, sports_drinks, plant_based_oils,
    deli, vegetarian_protein, soda, eat_out, whole_grains, chocolate, poultry_with_skin,
    cereal, salsa, ice_cream, chips, condiments, juice, 
    french_fries,  fruit, potatoes, popcorn,gender,beans,
    ROW_NUMBER() OVER(ORDER BY b.user_id, b.date_trunc, a.response_date) as rn
    FROM public.zhei_user_consume_values_temp as b 
    FULL OUTER JOIN public.zhei_user_ffq_values_temp as a ON a.user_id=b.user_id
    WHERE ( abs(DATEDIFF('day', a.response_date , b.date_trunc)) <=3 ) 
    ORDER BY b.user_id, b.date_trunc, a.response_date
),
calc_values AS
( 
  SELECT  rn,
    user_id,
    date_trunc,
    gender,
    fruits, 
    vegetables,
    other_vegetables, milk, drink_water,
    ( ( fiber  / ( ( fruits*15 ) + (vegetables*5 ) + ( whole_grain_bread*22 ) + ( whole_grains*46 ) +
      ( ( pizza + cereal + (french_fries * 1.5) + potatoes + chocolate + 
          (donuts*1.5) + cookies + ice_cream + (soda*1.5) + (sports_drinks*1.5) + 
          juice + chips + (popcorn*0.6) ) * 30.0 
        )
        + 103 
        ) 
      ) / 0.1 
    ) as carb_calc,
    (
      CASE WHEN (red_meat+deli)=0.0
        THEN ( 1 / 4.0)
        ELSE (((poultry_with_skin+poultry_without_skin+fish+shellfish + nuts + vegetarian_protein + beans)/(red_meat + deli))/4.0)
      END 
    ) as protein_calc,		
    (	
      (pizza) +
      (french_fries*0.5) +
      (red_meat) +
      (deli*2.5) +
      (pork) +
      (poultry_with_skin*0.75) +
      (cheese) +
      (nuts*0.25) +
      (chocolate*1.5) +
      (donuts) +
      (cookies*0.5) +
      (ice_cream*1.25) +
      (salad_dressing_mayo*0.5) +
      (decode(milk_type, 'whole', milk, 0 ) )+
      (chips*0.25)
    ) AS sat_fats_calc,
    decode( gender, 'MALE', ((fish*0.25) + (nuts*0.75) +(plant_based_oils* 0.2)),
    'FEMALE', ((fish*0.3) + (nuts) + (plant_based_oils * 0.25)),
                   0
    ) as healthy_fats_calc,
    ( ( 3.4 -	
      ( ( 
          (eat_out*2) +
          (whole_grain_bread*0.5) +
          (pizza) +
          (cereal*0.5) +
          (french_fries*0.5) +
          (red_meat) +
          (deli*2) +
          (pork) +
          (poultry_without_skin) +
          (poultry_with_skin) +
          (fish) +
          (shellfish) +
          (cheese) +
          (beans*0.5) +
          (nuts*0.5) +
          (condiments*1.5) +
          (salad_dressing_mayo*0.25) +
          (salsa*1.5) +
          (tomato_sauce) +
          (chips) +
          (popcorn)
        ) * 0.575 
      )
      ) / 1.1 
    )  as sodium,
    ( 
      ( ( (fruit*0.75) + (green_vegetables*0.3) + (other_vegetables*0.5) + drink_water + caffeine + juice + milk )*250.0
      )/3000.0
    ) as hydration         
  FROM merge_temp_tab ORDER BY rn
),
calc_values_2 AS (
  SELECT rn, user_id, date_trunc, healthy_fats_calc, sat_fats_calc,
    (decode(fruits,NULL,NULL,least(fruits,4.0)) /4.0 )*10 as fruits,
    (decode(vegetables,NULL,NULL,least(vegetables,5.0)) /5.0 )*10 as vegetables,
    decode(carb_calc,NULL,NULL,least(carb_calc,1.0))*10 as carb_ratio,
    decode(protein_calc,NULL,NULL,least(protein_calc,1.0))*10 as protein_ratio,
    CASE WHEN sat_fats_calc=0.0 -- consider healthy_fats_calc/0 as infinity. Per pandas this is > 1. hence set to 1.
      THEN decode(healthy_fats_calc, NULL, NULL, 1)*10
      ELSE decode(healthy_fats_calc/sat_fats_calc, NULL, NULL, least(healthy_fats_calc/sat_fats_calc, 1.0))*10
    END AS fat_ratio,
    decode(sodium,NULL,NULL,greatest(least(sodium,1),0))*10 as sodium,
    decode(hydration,NULL,NULL,least(hydration,1.0))*10 as hydration
  FROM calc_values
  WHERE ( nvl2(fruits,0,1) + nvl2(vegetables,0,1) + nvl2(carb_calc,0,1) + nvl2(protein_calc,0,1) + nvl2( healthy_fats_calc, 0, 1) + nvl2(sodium,0,1) + nvl2(hydration,0,1) ) <= 3
  ORDER BY rn
),
median_fruits AS 
(
  SELECT median(fruits) as median_fruits
  FROM calc_values_2
),
median_vegetables AS 
(
  SELECT median(vegetables) as median_vegetables
  FROM calc_values_2
),
median_fat_ratio AS 
(
  SELECT median(fat_ratio) as median_fat_ratio
  FROM calc_values_2
),
median_carb_ratio AS 
(
  SELECT median(carb_ratio) as median_carb_ratio
  FROM calc_values_2
),
median_protein_ratio AS 
(
  SELECT median(protein_ratio) as median_protein_ratio
  FROM calc_values_2
),
median_sodium AS 
(
  SELECT median(sodium)  as median_sodium 
  FROM calc_values_2
),
median_hydration AS 
(
  SELECT median(hydration)  as median_hydration 
  FROM calc_values_2
),
calc_values_3 AS
(
  SELECT user_id, date_trunc as date,
    nvl2(fruits,fruits,median_fruits) as fruits, 
    nvl2(vegetables,vegetables,median_vegetables) as vegetables, 
    nvl2(carb_ratio,carb_ratio,median_carb_ratio) as carb_ratio, 
    nvl2(protein_ratio,protein_ratio,median_protein_ratio) as protein_ratio,
    nvl2(fat_ratio,fat_ratio,median_fat_ratio) as fat_ratio,
    nvl2(sodium,sodium,median_sodium) as sodium, 
    nvl2(hydration,hydration,median_hydration) as hydration
  FROM calc_values_2, median_fruits, median_vegetables, median_fat_ratio, median_sodium, median_carb_ratio, median_protein_ratio, median_hydration
)
SELECT *, 
  NULL as imputed,
  ( ((decode(fruits,NULL,0,fruits)+decode(vegetables,NULL,0,vegetables))/2) + 
  decode(carb_ratio,NULL,0,carb_ratio) + 
  decode(protein_ratio,NULL,0,protein_ratio) + 
  decode(fat_ratio,NULL,0,fat_ratio) + 
  decode(sodium,NULL,0,sodium) + 
  decode(hydration,NULL,0,hydration) 
  ) as total_score
FROM calc_values_3
ORDER BY user_id, date;
    `,
  })
}