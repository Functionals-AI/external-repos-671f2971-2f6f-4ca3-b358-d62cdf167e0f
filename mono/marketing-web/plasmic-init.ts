import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";

const PLASMIC_PROJECT_ID = process.env.PLASMIC_PROJECT_ID || '';
const PLASMIC_TOKEN = process.env.PLASMIC_TOKEN || '';
const IS_PREVIEW_ENABLED = !['staging', 'production'].includes(process.env.NODE_ENV);
const VERSION = ['staging', 'production'].includes(process.env.NODE_ENV) ? process.env.NODE_ENV : 'latest';

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: PLASMIC_PROJECT_ID,  // ID of a project you are using
      token: PLASMIC_TOKEN,  // API token for that project
      version: VERSION,
    }
  ],
  // Fetches the latest revisions, whether or not they were unpublished!
  preview: IS_PREVIEW_ENABLED,
})