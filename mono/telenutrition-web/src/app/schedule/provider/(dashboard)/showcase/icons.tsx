import ButtonToggle from '@/ui-components/form/button-toggle';
import { svgs } from '@/ui-components/icons/generated_svg_names';
import Icon, { IconProps, colorMap } from '@/ui-components/icons/Icon';
import { useState } from 'react';

export default function IconsTab() {
  const [iconColor, setIconColor] = useState<NonNullable<IconProps['color']>>('neutral');
  return (
    <div className="flex flex-col gap-y-8">
      icons
      <ButtonToggle
        value={iconColor}
        onChange={(color) => setIconColor(color as NonNullable<IconProps['color']>)}
        options={Object.keys(colorMap).map((color) => ({ name: color, value: color }))}
      />
      <div className="grid grid-cols-6 gap-4 px-20">
        {svgs.map((svgName) => (
          <div key={svgName} className="flex items-center justify-center">
            <div className="col-span-1 flex flex-col gap-y-1 items-center p-2 w-40">
              <Icon color={iconColor} name={svgName} />
              <p>{svgName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
