import * as path from "path";
import axios from "axios";
const AdmZip = require("adm-zip");
import { Context } from "..";
import { handleAxiosError } from "./helpers";

const LOKALISE_API_PROJECT_ID = "657877016413250db791b6.68056811";
const LOKALISE_WEB_PROJECT_ID = "19840420641223c0ae7506.95803678";

const root = path.join(__dirname, "..", "..", "..");
const dest = path.join(__dirname, "..", "..", "locales");

async function main() {
  const context = await Context.create();
  const { config } = context;

  const lokaliseApiKey = config.common.lokalise?.apiKey;

  if (lokaliseApiKey === undefined) {
    console.error("No Lokalise API Key in config");
    process.exit(1);
  }

  async function downloadFile(
    projectId: string,
    additionalPayload: Record<string, string | number | boolean> = {}
  ) {
    return axios.post<{ bundle_url: string }>(
      `https://api.lokalise.com/api2/projects/${projectId}/files/download`,
      {
        format: "json",
        original_filenames: false,
        replace_breaks: false,
        ...additionalPayload,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "X-Api-Token": lokaliseApiKey!,
        },
      }
    );
  }

  async function downloadApiStrings() {
    try {
      const res = await downloadFile(LOKALISE_API_PROJECT_ID);

      const asArrayBuffer = await axios.get(res.data.bundle_url, {
        responseType: "arraybuffer",
      });

      const zip = new AdmZip(asArrayBuffer.data);

      zip.extractEntryTo("locale/es.json", `${dest}`, false, true);

      console.log("Successfully downloaded api/common es file from lokalise");
    } catch (e) {
      handleAxiosError(e);
    }
  }

  async function downloadWebStrings() {
    try {
      const res = await downloadFile(LOKALISE_WEB_PROJECT_ID, {
        indentation: "2sp",
      });

      const asArrayBuffer = await axios.get(res.data.bundle_url, {
        responseType: "arraybuffer",
      });

      const zip = new AdmZip(asArrayBuffer.data);

      zip.extractEntryTo(
        "locale/es.json",
        `${root}/telenutrition-web/src/translations/locales`,
        false,
        true
      );
      zip.extractEntryTo(
        "locale/en.json",
        `${root}/telenutrition-web/src/translations/locales`,
        false,
        true
      );

      console.log("Successfully downloaded api/common es file from lokalise");
    } catch (e) {
      handleAxiosError(e);
    }
  }

  downloadApiStrings();
  downloadWebStrings();
}
main();
