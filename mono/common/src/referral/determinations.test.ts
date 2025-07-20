import { AccountIds } from '../account/service';
import { IContext } from '../context';
import { determineVendor, VendorData, VendorPreferenceData } from './determinations';
import * as foodVendorStore from '../food-vendor/store';

//mock the context
const context = {
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    trace: jest.fn(),
    exception: jest.fn(),
    tag: jest.fn(),
  },
} as unknown as IContext;

const calOptimaAccountId = AccountIds.CalOptima;
const santaClaraAccountId = AccountIds.SantaClara;

// since we will always be querying with an accountId, we can assume vendor data will be account specific

const CalOptimaVendors: VendorData[] = [
  {
    vendorName: 'meals_on_wheels',
    vendorDisplayLabel: 'Meals on Wheels',
    offerings: ['grocery_boxes', 'prepared_meals'],
    vegetarianOptions: false,
  },
  {
    vendorName: 'ga_foods',
    vendorDisplayLabel: 'GA Foods',
    offerings: ['frozen_meals', 'grocery_boxes', 'prepared_meals'],
    vegetarianOptions: true,
  },
  {
    vendorName: 'lifespring',
    vendorDisplayLabel: 'Lifespring',
    offerings: ['prepared_meals'],
    vegetarianOptions: true,
  },
  {
    vendorName: 'bento',
    vendorDisplayLabel: 'Bento',
    offerings: ['grocery_boxes'],
    vegetarianOptions: true,
  },
  {
    vendorName: 'sunterra',
    vendorDisplayLabel: 'Sunterra',
    offerings: ['grocery_boxes'],
    vegetarianOptions: true,
  },
];

const SantaClaraVendors: VendorData[] = [
  {
    vendorName: 'sunterra',
    vendorDisplayLabel: 'Sunterra',
    offerings: ['grocery_boxes'],
    vegetarianOptions: true,
  },
  {
    vendorName: 'loaves_and_fishes',
    vendorDisplayLabel: 'Loaves and Fishes',
    offerings: ['frozen_meals', 'grocery_boxes', 'hot_meals'],
    vegetarianOptions: false,
  },
  {
    vendorName: 'roots_food_group',
    vendorDisplayLabel: 'Roots Food Group',
    offerings: ['frozen_meals'],
    vegetarianOptions: false,
  },
  {
    vendorName: 'moms_meals',
    vendorDisplayLabel: "Mom's Meals",
    offerings: ['refrigerated_meals'],
    vegetarianOptions: false,
  },
];

const allCalOptimaProviders = CalOptimaVendors.map((provider) => provider.vendorName);
const allCalOptimaPreparedMealProviders = CalOptimaVendors.filter((provider) =>
  provider.offerings.includes('prepared_meals'),
).map((provider) => provider.vendorName);
const allCalOptimaGroceryBoxProviders = CalOptimaVendors.filter((provider) =>
  provider.offerings.includes('grocery_boxes'),
).map((provider) => provider.vendorName);
const allCalOptimaVegetarianMtmProviders = CalOptimaVendors.filter(
  (provider) => provider.vegetarianOptions && provider.offerings.includes('prepared_meals'),
).map((provider) => provider.vendorName);
const allCalOptimaVegetarianGroceryBoxProviders = CalOptimaVendors.filter(
  (provider) => provider.vegetarianOptions && provider.offerings.includes('grocery_boxes'),
).map((provider) => provider.vendorName);
const allCalOptimaFrozenMealProviders = CalOptimaVendors.filter((provider) =>
  provider.offerings.includes('frozen_meals'),
).map((provider) => provider.vendorName);

const calOptimaTestCases: { data: VendorPreferenceData; source: number; expected: string[] }[] = [
  {
    data: {
      foodBenefit: 'prepared_meals',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'lifespring',
    },
    source: calOptimaAccountId,
    expected: ['lifespring'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'bento',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: ['sunterra'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'bento',
    },
    source: calOptimaAccountId,
    expected: ['bento'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'lifepring',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianMtmProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'meals_on_wheels',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianMtmProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'ga_foods',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'lifespring',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: ['lifespring'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'bento',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianMtmProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'sunterra',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianMtmProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'sunterra',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: ['sunterra'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'bento',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: ['bento'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'ga_foods',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'meals_on_wheels',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'lifepring',
      vegetarianFlag: true,
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      previousVendor: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      previousVendor: 'lifespring',
    },
    source: calOptimaAccountId,
    expected: ['lifespring'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      previousVendor: 'bento',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      previousVendor: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      previousVendor: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: ['sunterra'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      previousVendor: 'bento',
    },
    source: calOptimaAccountId,
    expected: ['bento'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      previousVendor: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      previousVendor: 'lifepring',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vegetarianFlag: true,
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaVegetarianMtmProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'meals_on_wheels',
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'ga_foods',
      previousVendor: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'lifespring',
      previousVendor: 'lifespring',
    },
    source: calOptimaAccountId,
    expected: ['lifespring'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'bento',
      previousVendor: 'bento',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'sunterra',
      previousVendor: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'sunterra',
      previousVendor: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: ['sunterra'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'bento',
      previousVendor: 'bento',
    },
    source: calOptimaAccountId,
    expected: ['bento'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'ga_foods',
      previousVendor: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'meals_on_wheels',
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'lifepring',
      previousVendor: 'lifepring',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'meals_on_wheels',
      previousVendor: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'ga_foods',
      previousVendor: 'lifespring',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'lifespring',
      previousVendor: 'bento',
    },
    source: calOptimaAccountId,
    expected: ['lifespring'],
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'bento',
      previousVendor: 'sunterra',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'sunterra',
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'sunterra',
      previousVendor: 'bento',
    },
    source: calOptimaAccountId,
    expected: ['sunterra'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'bento',
      previousVendor: 'ga_foods',
    },
    source: calOptimaAccountId,
    expected: ['bento'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'ga_foods',
      previousVendor: 'meals_on_wheels',
    },
    source: calOptimaAccountId,
    expected: ['ga_foods'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'meals_on_wheels',
      previousVendor: 'lifespring',
    },
    source: calOptimaAccountId,
    expected: ['meals_on_wheels'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'lifepring',
      previousVendor: 'lifespring',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'refrigerated_meals',
      vendorPreference: 'roots_food_group',
    },
    source: calOptimaAccountId,
    expected: allCalOptimaFrozenMealProviders,
  },
];

const allSantaClaraProviders = SantaClaraVendors.map((provider) => provider.vendorName);
const allSantaClaraPreparedMealProviders = SantaClaraVendors.filter((provider) =>
  provider.offerings.includes('prepared_meals'),
).map((provider) => provider.vendorName);
const allSantaClaraGroceryBoxProviders = SantaClaraVendors.filter((provider) =>
  provider.offerings.includes('grocery_boxes'),
).map((provider) => provider.vendorName);
const allSantaClaraFrozenMealProviders = SantaClaraVendors.filter((provider) =>
  provider.offerings.includes('frozen_meals'),
).map((provider) => provider.vendorName);
const allSantaClaraRefrigeratedMealProviders = SantaClaraVendors.filter((provider) =>
  provider.offerings.includes('refrigerated_meals'),
).map((provider) => provider.vendorName);
const allSantaClaraHotMealProviders = SantaClaraVendors.filter((provider) =>
  provider.offerings.includes('hot_meals'),
).map((provider) => provider.vendorName);
const allSantaClaraVegetarianProviders = SantaClaraVendors.filter((provider) => provider.vegetarianOptions).map(
  (provider) => provider.vendorName,
);

const santaClaraTestCases: { data: VendorPreferenceData; source: number; expected: string[] }[] = [
  {
    data: {
      foodBenefit: 'prepared_meals',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'hot_meals',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraHotMealProviders,
  },
  {
    data: {
      foodBenefit: 'refrigerated_meals',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraRefrigeratedMealProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
      vendorPreference: 'sunterra',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraPreparedMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'sunterra',
    },
    source: santaClaraAccountId,
    expected: ['sunterra'],
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'loaves_and_fishes',
    },
    source: santaClaraAccountId,
    expected: ['loaves_and_fishes'],
  },
  {
    data: {
      foodBenefit: 'frozen_meals',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraFrozenMealProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'aggrigator',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'grocery_boxes',
      vendorPreference: 'moms_meals',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraGroceryBoxProviders,
  },
  {
    data: {
      foodBenefit: 'frozen_meals',
      vendorPreference: 'nothing',
      vegetarianFlag: true,
    },
    source: santaClaraAccountId,
    expected: allSantaClaraVegetarianProviders,
  },
  {
    data: {
      foodBenefit: 'prepared_meals',
    },
    source: santaClaraAccountId,
    expected: allSantaClaraProviders,
  },
];

jest.mock('../food-vendor/store', () => ({
  ...jest.requireActual('../food-vendor/store'),
  getFoodVendors: jest.fn(),
}));

describe('determineVendors', () => {
  describe('determineCalOptimaVendors', () => {
    beforeAll(() => {
      (foodVendorStore.getFoodVendors as jest.Mock).mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
        get value() {
          return CalOptimaVendors;
        },
      });
    });

    test.each(calOptimaTestCases)('%o', async ({ data, source, expected }) => {
      const expectedResults = new Set(expected);

      let counter = 0;

      // run the test loop at most 100 times while trying to get one of each expected result
      while (expectedResults.size > 0 && counter < 100) {
        // run the test 100 times to smoke out bad random results
        for (let i = 0; i < 100; i++) {
          const result = await determineVendor(context, source, data);

          expect(result.isOk()).toBe(true);

          if (result.isOk() && result.value !== null) {
            expect(expected).toContain(result.value);

            expectedResults.delete(result.value);
          }
        }

        counter++;
      }
      expect(expectedResults.size).toBe(0);
    });

    it('should return an error if the data is invalid', async () => {
      const calOptimaId = AccountIds.CalOptima;
      const result = await determineVendor(context, calOptimaId, { foodBenefit: 'invalid' });

      expect(result.isErr()).toBe(false);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value).toBe(null);
      }
    });
  });

  describe('determineSantaClaraVendors', () => {
    beforeAll(() => {
      (foodVendorStore.getFoodVendors as jest.Mock).mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
        get value() {
          return SantaClaraVendors;
        },
      });
    });

    test.each(santaClaraTestCases)('%o', async ({ data, source, expected }) => {
      const expectedResults = new Set(expected);

      let counter = 0;

      // run the test loop at most 100 times while trying to get one of each expected result
      while (expectedResults.size > 0 && counter < 100) {
        // run the test 100 times to smoke out bad random results
        for (let i = 0; i < 100; i++) {
          const result = await determineVendor(context, source, data);

          expect(result.isOk()).toBe(true);

          if (result.isOk() && result.value !== null) {
            expect(expected).toContain(result.value);

            expectedResults.delete(result.value);
          }
        }

        counter++;
      }

      expect(expectedResults.size).toBe(0);
    });
  });
});
