/**
 * Since the environment variables used here will be replaced during the build step,
 * the conditional will be evaluated and optimized away.
 */
export function getIconSrc(name: string): string {
  if (process.env.NEXT_PUBLIC_ASSETS_CDN_URL) {
    return `${process.env.NEXT_PUBLIC_ASSETS_CDN_URL}/telenutrition-web/icons/${name}.svg`
  } else {
    return `/icons/${name}.svg`;
  }
}