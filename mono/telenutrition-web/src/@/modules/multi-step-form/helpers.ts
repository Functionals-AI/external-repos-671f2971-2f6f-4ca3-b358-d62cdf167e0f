import _ from 'lodash';

import { FieldValues } from 'react-hook-form';

/**
 * Get an object of values that have changed between two objects.
 */
export function getUpdatedValues(values: FieldValues, prevValues: FieldValues): FieldValues {
  const allkeys = _.union(_.keys(values), _.keys(prevValues));
  const difference = _.reduce(
    allkeys,
    (result, key) => {
      if (!_.isEqual(values[key], prevValues[key])) {
        result[key] = values[key];
      }
      return result;
    },
    {} as FieldValues,
  );
  return difference;
}
