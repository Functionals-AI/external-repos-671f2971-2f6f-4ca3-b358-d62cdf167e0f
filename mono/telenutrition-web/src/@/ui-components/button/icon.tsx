import { Button, type ButtonProps, ButtonTheme, ButtonVariant, iconButtonSizeClassMap } from ".";
import { cn } from '@/utils';
import Icon, { colorVariant, IconProps } from "../icons/Icon";

type IconButtonProps = Omit<ButtonProps, 'leftIcon'> & {
  iconName: IconProps['name'];
};

type ColorType = {
  primary: colorVariant;
  secondary: colorVariant;
  tertiary: colorVariant;
  quaternary: colorVariant;
};

type ColorMap = {
  primary: ColorType;
  destructive: ColorType;
};

const colorMap: ColorMap = {
  primary: {
    primary: 'white',
    secondary: 'neutral',
    tertiary: 'fsGreen',
    quaternary: 'neutral',
  },
  destructive: {
    primary: 'white',
    secondary: 'statusRed',
    tertiary: 'statusRed',
    quaternary: 'statusRed',
  },
};
export default function IconButton({
  size = 'default',
  theme = 'primary',
  variant = 'primary',
  iconName,
  className,
  ...props
}: IconButtonProps) {
  const iconSize = iconButtonSizeClassMap[size];
  const found = colorMap[theme];
  const colorVariant = found[variant];
  return (
    <Button variant={variant} theme={theme} className={cn(iconSize.button, className, 'min-w-0')} {...props}>
      <Icon
        name={iconName}
        color={colorVariant}
        size={'xs'}
        className={iconSize.icon} /> {/*color={'white'}*/}
    </Button>
  );
}
