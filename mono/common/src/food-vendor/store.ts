import { Result, err, ok } from 'neverthrow';
import * as db from 'zapatos/db';
import * as zs from 'zapatos/schema';
import { IContext } from '../context';
import { ErrCode } from '../error';
import { VendorData, VendorCode, BenefitType, FoodOffering } from '../referral/determinations';

const MTAG = ['common', 'food-vendor', 'store'];

function mapVendorData(vendor: {
  food_vendor_id: number;
  vendor_code: string;
  display_label: string;
  vegetarian_options: boolean;
  offerings: string[];
}): VendorData {
  const mappedVendor = {
    vendorName: vendor.vendor_code as VendorCode,
    vendorDisplayLabel: vendor.display_label,
    offerings: vendor.offerings as BenefitType[],
    vegetarianOptions: vendor.vegetarian_options,
  };

  return mappedVendor;
}

export async function getFoodOfferingTypes(context: IContext): Promise<Result<FoodOffering[], ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getFoodOfferingTypes'];
  try {
    const pool = await context.store.reader();

    const foodOfferingTypesResult = await db.sql<
      zs.telenutrition.food_offering_type.SQL,
      zs.telenutrition.food_offering_type.Selectable[]
    >`
      SELECT * FROM ${'telenutrition.food_offering_type'}
      ORDER BY ${'food_offering_type_id'};
    `.run(pool);

    if (foodOfferingTypesResult.length === 0) {
      logger.info(context, TAG, 'No food offering types found in the database');
      return ok([]);
    }

    const foodOfferingTypes = foodOfferingTypesResult.map(
      (b) =>
        ({
          offeringType: b.offering_type,
          displayLabel: b.display_label,
        }) as FoodOffering,
    );

    return ok(foodOfferingTypes);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getFoodVendors(context: IContext, accountId: number): Promise<Result<VendorData[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getFoodVendors'];

  try {
    const pool = await reader();

    const vendorData = await db.sql<
      | zs.telenutrition.food_vendor.SQL
      | zs.telenutrition.account_food_offering_vendor_mapping.SQL
      | zs.telenutrition.food_offering_type.SQL
      | zs.common.account.SQL,
      {
        food_vendor_id: number;
        vendor_code: string;
        display_label: string;
        vegetarian_options: boolean;
        offerings: string[];
      }[]
    >`
      SELECT
        afovm.${`food_vendor_id`},
        fv.${`vendor_code`},
        fv.${`display_label`},
        fv.${`vegetarian_options`},
        jsonb_agg(DISTINCT fot.${`offering_type`} ORDER BY fot.${`offering_type`}) AS offerings
      FROM (
        SELECT
          ${`food_vendor_id`},
          ${`food_offering_type_id`},
          CASE
            WHEN bool_and(a.${`name`} IS NULL) THEN '[]'::jsonb
            ELSE jsonb_agg(
              DISTINCT a.${`name`}
              ORDER BY a.${`name`}
            )
          END AS account_names
        FROM ${`telenutrition.account_food_offering_vendor_mapping`} afovm
        LEFT JOIN ${`common.account`} a ON afovm.${`account_id`} = a.${`account_id`}
        WHERE afovm.${`account_id`} = ${db.param(accountId)}
        GROUP BY ${`food_vendor_id`}, ${`food_offering_type_id`}
      ) afovm
      JOIN ${`telenutrition.food_offering_type`} fot ON afovm.${`food_offering_type_id`} = fot.${`food_offering_type_id`}
      JOIN ${`telenutrition.food_vendor`} fv ON fv.${`food_vendor_id`} = afovm.${`food_vendor_id`}
      GROUP BY
        afovm.${`food_vendor_id`},
        fv.${`vendor_code`},
        fv.${`display_label`},
        fv.${`vegetarian_options`}
      ORDER BY afovm.${`food_vendor_id`}
    `.run(pool);

    if (vendorData.length === 0) {
      logger.info(context, TAG, 'No food vendors found in the database');
      return ok([]);
    }

    const vendors = vendorData.map(mapVendorData);

    return ok(vendors);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}
