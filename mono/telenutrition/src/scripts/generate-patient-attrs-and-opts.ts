import Context from '@mono/common/lib/context';
import * as db from 'zapatos/db';
const _ = require('lodash');
const fs = require('fs');
import { PatientAttributeName } from '../patient-attribute-types';

const TAG = 'scripts.patient-attributes-and-options';

type PatientAttributeOption = {
  option_code: string;
  option_text: string;
  ontology_concept_id: number;
  patient_attribute_id: number;
  qualifier_concept_id: number | null;
  patient_attribute_option_id: number;
  associated_concept_id: number | null;
  is_active: boolean;
};

async function main() {
  const context = await Context.create();
  const {
    logger,
    store: { reader },
  } = context;
  try {
    const pool = await reader();

    const patientAttributes = await db.select('telenutrition.patient_attribute', {}).run(pool);

    const patientAttributeNames: string[] = patientAttributes.map((pa) => pa.attribute_code);

    const attrNamesStr = patientAttributeNames.map((name) => ` '${name}'`).join(',\n');
    const typeStr = `export const patientAttributeNames = [
      ${attrNamesStr}
    ] as const;
    
    export type PatientAttributeName = (typeof patientAttributeNames)[number];\n
    `;

    fs.writeFileSync('../telenutrition/src/patient-attribute-types.ts', typeStr);

    // We should fetch all but use is_active to determine which options are valid for new submissions
    const patientAttributeOptions = await db.select('telenutrition.patient_attribute_option', {}).run(pool);

    const optionsByAttribute: Record<PatientAttributeName, PatientAttributeOption[]> = _.groupBy(
      patientAttributeOptions,
      (opt) => {
        const paAttr = patientAttributes.find((pa) => pa.patient_attribute_id === opt.patient_attribute_id);
        if (!paAttr) {
          throw new Error(`Patient attribute not found for ID: ${opt.patient_attribute_id}`);
        }

        return paAttr.attribute_code;
      },
    );

    const optionsStr = Object.entries(optionsByAttribute)
      .filter(([key]) => key !== 'etiology')
      .map(([key, value]) => {
        return `
        '${key}': {
          ${value.map((opt) => `"${opt.option_code}": { ${!opt.is_active ? 'is_inactive: true,' : ''} option_text: i18n.__(${JSON.stringify(opt.option_text)}), option_code: "${opt.option_code}"
          }`).join(',\n')}
        }
        `;
      });

    const problemOptions = optionsByAttribute.problem;
    const etiologyOptions = optionsByAttribute.etiology;

    const pesStatementOptionsMap = problemOptions.reduce<Record<string, PatientAttributeOption[]>>((acc, opt) => {
      const ontologyConceptId = opt.ontology_concept_id;
      const children = etiologyOptions.filter((etiologyOpt) => etiologyOpt.associated_concept_id === ontologyConceptId);
      return { ...acc, [opt.option_code]: children };
    }, {});

    const pesStatementOptionsStr = Object.entries(pesStatementOptionsMap).map(([key, value]) => {
      return `
        '${key}': [${value.map((opt) => `{ option_text: i18n.__(${JSON.stringify(opt.option_text)}), option_code: "${opt.option_code}" }`).join(',\n')}]
      `;
    });

    const finalStr = `
      import { IContext } from '@mono/common/lib/context';
      export const getPatientAttributeOptions = ({ i18n }: IContext) => ({\n${optionsStr.join(',\n')}}) as const;\n

      export const getPesStatementOptions  = ({ i18n }: IContext) => ({${pesStatementOptionsStr.join(',\n')}}) as const;\n
    `;

    fs.writeFileSync('../telenutrition/src/patient-attribute-options.ts', finalStr);
  } catch (e) {
    logger.exception(context, `${TAG}.error`, e);
  } finally {
    await Context.destroy(context);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
