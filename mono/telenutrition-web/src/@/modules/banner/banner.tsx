import { cn } from '@/utils';
import { Button } from '@/ui-components/button';
import { Banner, BannerSize, BannerVariant } from '.';
import { ClassValue } from 'clsx';
import Icon, { SvgName } from '@/ui-components/icons/Icon';

const bannerVariantClassName: Record<BannerVariant, ClassValue> = {
  primary: 'bg-status-green-100',
  destructive: 'bg-status-red-100',
  info: 'bg-blue-100',
  warn: 'bg-status-amber-100',
};

const bannerSizeClasses: Record<
  BannerSize,
  {
    wrapper: ClassValue;
    icon: ClassValue;
    message: ClassValue;
    description?: ClassValue;
  }
> = {
  large: { wrapper: 'px-4 py-2', icon: '', message: 'text-lg', description: 'text-sm' },
  small: { wrapper: 'px-2 py-1', icon: 'scale-[.7]', message: 'text-base', description: 'text-xs' },
};

const bannerIcon: Record<BannerVariant, SvgName> = {
  primary: 'check-circle',
  info: 'info-circle',
  destructive: 'alert',
  warn: 'alert-triangle',
};

export default function BannerBar({
  banner,
  dataTestId,
  className,
  bannerIconName,
}: {
  banner: Banner;
  dataTestId?: string;
  className?: string;
  bannerIconName?: SvgName;
}) {
  const { wrapper, icon, message, description } = bannerSizeClasses[banner.size];
  const iconName = bannerIconName ?? bannerIcon[banner.type];
  const buttonSize = banner.size === 'small' ? 'sm' : 'default';
  const bannerIconColor = banner.type;
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'w-full flex items-center justify-between text-fs-neutral-1500',
        bannerVariantClassName[banner.type],
        wrapper,
        className,
      )}
    >
      <div className="flex items-center gap-x-2">
        <Icon
          name={iconName}
          className={cn(
            banner.size === 'small' ? 'w-4' : 'w-7',
            banner.type == 'info'
              ? 'text-blue-400'
              : banner.type == 'warn'
                ? 'text-status-amber-150'
                : banner.type == 'destructive'
                  ? 'text-status-red-400'
                  : 'text-status-green-200',
          )}
        />
        <div className="flex flex-col gap-y-1 ml-2">
          <h4 className={cn('font-bold', message)}>{banner.message}</h4>
          <p className={cn('', description)}>{banner.description}</p>
        </div>
      </div>
      {banner.action && (
        <Button variant={'secondary'} onClick={banner.action.onClick} size={buttonSize}>
          {banner.action.title}
        </Button>
      )}
    </div>
  );
}
