import * as path from "path";
import * as fs from "fs";
import { Project } from "ts-morph";
import axios from "axios";
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

  async function uploadFileToLokalise(
    projectId: string,
    destDir: string,
    fileName: string
  ) {
    const project = new Project();
    project.addSourceFileAtPath(`${destDir}/${fileName}`);
    const file = project.getSourceFile(fileName);
    if (!file) throw new Error(`File ${destDir}/${fileName} not found`);

    const readFile = fs.readFileSync(file.getFilePath(), {
      encoding: "base64",
    });

    return axios.post(
      `https://api.lokalise.com/api2/projects/${projectId}/files/upload`,
      {
        filename: "en.json",
        data: readFile,
        lang_iso: "en",
        convert_placeholders: false,
        replace_modified: true,
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

  async function uploadApiStrings() {
    try {
      const res = await uploadFileToLokalise(
        LOKALISE_API_PROJECT_ID,
        dest,
        "en.json"
      );

      console.log("Successfully uploaded api/common en.json file to lokalise");
    } catch (e) {
      handleAxiosError(e);
    }
  }

  async function uploadWebStrings() {
    try {
      const res = await Promise.all([
        uploadFileToLokalise(
          LOKALISE_WEB_PROJECT_ID,
          `${root}/telenutrition-web/src/translations/extracted`,
          "en.json"
        ),
        uploadFileToLokalise(
          LOKALISE_WEB_PROJECT_ID,
          `${root}/telenutrition-web/src/translations/extracted`,
          "missing.en.json"
        ),
      ]);

      console.log(
        "Successfully uploaded web en.json and missing.en.json file to lokalise"
      );
    } catch (e) {
      handleAxiosError(e);
    }
  }

  uploadApiStrings();
  uploadWebStrings();
}

main();
