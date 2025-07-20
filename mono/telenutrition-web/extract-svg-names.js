const fs = require('fs');
const iconNames = fs.readdirSync('./public/icons/');
const _ = require('lodash');

const names = [];

const writeStr = iconNames.map((iconName) => {
  const dashName = iconName.split('.')[0];
  const typeName = _.startCase(iconName).replace(/ /g, '');
  // const camelName = _.camelCase(iconName);
  names.push({ typeName, dashName: dashName });

  return `
  type ${typeName} = '${dashName}';
  `;
});

const endingStr1 = `export type SvgName = ${names.map(({ typeName }) => typeName).join(' | ')};`;
const endingStr2 = `export const svgs: SvgName[] = [${names.map(({ dashName }) => `'${dashName}'`).join(',')}];`;

fs.writeFileSync(
  './src/@/ui-components/icons/generated_svg_names.ts',
  writeStr.join('') + '\n' + endingStr1 + '\n' + endingStr2,
);
