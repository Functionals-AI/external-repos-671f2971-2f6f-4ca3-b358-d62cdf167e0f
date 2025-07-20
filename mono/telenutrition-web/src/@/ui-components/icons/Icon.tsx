import React from 'react';
import { ReactSVG } from 'react-svg';
import { cn } from '../../utils';
import { SvgName } from './generated_svg_names';
import { getIconSrc } from 'utils/getAssetSrc';
export { type SvgName };

export type colorVariant =
  | 'neutral'
  | 'neutral-150'
  | 'neutral-200'
  | 'blue'
  | 'statusGreen'
  | 'statusAmber'
  | 'statusRed'
  | 'statusRed800'
  | 'teal'
  | 'purple'
  | 'orange'
  | 'fsGreen'
  | 'fsGreen-100'
  | 'darkGreen'
  | 'white';
export type sizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const colorMap: Record<colorVariant, string> = {
  neutral: 'text-neutral-400',
  'neutral-150': 'text-neutral-150 group-hover:text-neutral-400',
  'neutral-200': 'text-neutral-200 group-hover:text-neutral-400',
  statusGreen: 'text-status-green-200',
  statusAmber: 'text-status-amber-150',
  statusRed: 'text-status-red-600',
  statusRed800: 'text-status-red-800',
  blue: 'text-blue-400',
  teal: 'text-teal-400',
  purple: 'text-purple-600',
  orange: 'text-orange-300',
  fsGreen: 'text-fs-green-300',
  'fsGreen-100': 'text-fs-green-100',
  darkGreen: 'text-fs-green-600',
  white: 'text-white',
};

const sizeMap: { [index: string]: number } = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

export interface IconProps extends React.HTMLAttributes<SVGSVGElement> {
  color?: colorVariant;
  name?: SvgName;
  size?: sizeVariant;
}

function Icon({ className, name = 'placeholder', color = 'neutral', size = 'md' }: IconProps) {
  const colorClass = colorMap[color];

  return (
    <ReactSVG
      src={getIconSrc(name)}
      className={cn(colorClass, className, name)}
      width={sizeMap[size]}
      height={sizeMap[size]}
      wrapper={'svg'}
    />
  );
}

export default Icon;
