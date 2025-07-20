import { SVGProps } from 'react';

export type IconProp = (props: SVGProps<SVGSVGElement>) => JSX.Element;

export enum SessionType {
  AudioOnly = 'audio_only',
  Video = 'video',
}

export enum SessionDuration {
  Thirty = '30',
  Sixty = '60',
}
