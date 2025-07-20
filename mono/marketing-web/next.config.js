/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers () {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      }
    ];
  },
  assetPrefix: '/marketing-web',
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Turn off React StrictMode for now, as react-aria (used by Plasmic)
  // has some troubles with it. See
  // https://github.com/adobe/react-spectrum/labels/strict%20mode
  reactStrictMode: false,
  async redirects () {
    const cmsId = process.env.PLASMIC_CMS_ID
    const publicKey = process.env.PLASMIC_CMS_PUBLIC_KEY

    if (!cmsId)
      throw new ReferenceError('No Plasmic CMS ID found in environment! Please add as $PLASMIC_CMS_ID');
    if (!publicKey)
      throw new ReferenceError('No Plasmic CMS Public Key found in environment! Please add as $PLASMIC_CMS_PUBLIC_KEY');
    if (!process.env.PLASMIC_CMS_SECRET_KEY)
      throw new ReferenceError('No Plasmic CMS Secret Key found in environment! Please add as $PLASMIC_CMS_SECRET_KEY');
    if (!process.env.PLASMIC_PROJECT_ID)
      throw new ReferenceError('No Plasmic Project ID found in environment! Please add as $PLASMIC_PROJECT_ID');
    if (!process.env.PLASMIC_TOKEN)
      throw new ReferenceError('No Plasmic Project Token found in environment! Please add as $PLASMIC_TOKEN');
    if (!process.env.TELENUTRITION_API_BASEURL)
        throw new ReferenceError(`No TELENUTRITION_API_BASEURL found in environment! Please add as $TELENUTRITION_API_BASEURL`);

    const publicToken = [cmsId, publicKey].join(':')
    const plasmicQuery = JSON.stringify({ limit: 1000000 })
    const plasmicRootUrl = 'https://data.plasmic.app/api/v1/cms/databases'
    const headers = new Headers({ 'x-plasmic-api-cms-tokens': publicToken })
    const queryString = (new URLSearchParams({ q: plasmicQuery })).toString()
    const url = `${plasmicRootUrl}/${cmsId}/tables/serverRedirects/query?${queryString}`
    const response = await fetch(url, { headers })
    const { rows } = await response.json()
    const redirects = rows.map(({ data }) => ({
      destination: data.destinationUrl,
      source: data.sourceUrl,
      permanent: data.permanent
    })).filter(({ source }) => source.startsWith('/'));

    return redirects
  }
}

module.exports = nextConfig
