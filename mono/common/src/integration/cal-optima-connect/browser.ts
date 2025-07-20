import { Result, ok, err } from 'neverthrow'
import { Browser, BrowserContext, Page, chromium } from 'playwright'
import { DateTime } from 'luxon'

import { IContext } from '../../context'
import { ErrCode } from '../../error'
import { CalOptimaVendor, CalOptimaVendorOption } from '../../config'
import { PerformReferralActionsOptions, ReauthData } from '../../referral/sources/caloptima'

export { Page } from 'playwright'

const MTAG = ['ops', 'integrations', 'caloptima', 'referral']

async function waitForLoader(page: Page, options?: any): Promise<void> {
  await page.waitForFunction(() => {
    const loader = document.getElementById('fullScreenAjaxLoaderDiv');
    return !loader || !loader.style.visibility;
  }, options);
}

async function loginCaloptimaConnect(context: IContext, page: Page): Promise<Result<void, ErrCode>> {
  const { logger, config } = context
  const TAG = [...MTAG, 'loginCaloptimaConnect']

  try {
    const calOptimaConfig = config.common?.referrals?.find(referral => referral.source === 'cal-optima')

    if (!calOptimaConfig) {
      logger.error(context, TAG, 'Cal Optima config not found.')

      return err(ErrCode.INVALID_CONFIG)
    }

    const { host, username, password } = calOptimaConfig.cal_optima_connect

    await page.goto(`${host}/mm/main/apps/index.mpl`)
    await page.getByLabel('Username:').click()
    await page.getByLabel('Username:').fill(username)
    await page.getByLabel('Username:').press('Tab')
    await page.getByLabel('Password:').fill(password)
    await page.getByRole('button', { name: 'Log In' }).click()

    await page.getByRole('button', { name: 'New Services' }).waitFor({ state: 'visible', timeout: 60000 })

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface CaloptimaConnectContext {
  browser: Browser,
  browserContext: BrowserContext,
  page: Page,
}

export async function createCaloptimaConnectContext(context: IContext, debugMode = false): Promise<Result<CaloptimaConnectContext, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'createCaloptimaConnectContext']

  try {

    let browser, browserContext;

    if (debugMode) {
      browser = await chromium.launch({
        headless: false,
        //devtools: true,
      });

      browserContext = await browser.newContext({
        viewport: {
          width: 1720,
          height: 1294
        }
      });
    } else {
      browser = await chromium.launch({
        headless: true
      });

      browserContext = await browser.newContext();
    }

    const page = await browserContext.newPage();

    const loginResult = await loginCaloptimaConnect(context, page)

    if (loginResult.isErr()) {
      logger.error(context, TAG, 'Error logging in.')

      return err(loginResult.error)
    }

    return ok({
      browser,
      browserContext,
      page
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function destroyCaloptimaConnectContext(context: IContext, sourceContext: CaloptimaConnectContext): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'destroyCaloptimaConnectContext']

  try {
    logger.info(context, TAG, `closing browser`)

    const {
      browser,
      browserContext
    } = sourceContext

    await browserContext.close()
    await browser.close()

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

type PageService = {
  firstName: string,
  lastName: string,
  dob: string,
  service: string,
  serviceDate: string,
  patientId: string,
  serviceId: string,
}

async function getPageServices(context: IContext, page: Page): Promise<Result<PageService[], ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'getPageServices']

  try {
    await page.getByRole('button', { name: 'New Services' }).waitFor({ state: 'visible', timeout: 60000 })
    await page.getByRole('button', { name: 'New Services' }).click()

    await page.locator('#showNewServices').waitFor({ state: 'visible', timeout: 60000 })

    const showNewServices = page.locator('#showNewServices')

    // Extract data from each row
    const rows = await showNewServices.locator('tbody > tr').all()
    const services: PageService[] = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents()
      if (cells.length === 0) continue; // Skip header rows

      // Extract patient_id and service_id from the onclick attribute
      const onclickAttr = await row.getAttribute('onclick')
      const patientIdMatch = onclickAttr?.match(/patient_id=(\d+)/)
      const serviceIdMatch = onclickAttr?.match(/service_id=(\d+)/)
      const patientId = patientIdMatch ? patientIdMatch[1] : ''
      const serviceId = serviceIdMatch ? serviceIdMatch[1] : ''

      if (cells[4] === 'CACS: Medically Tailored Meals') {
        services.push({
          firstName: cells[0],
          lastName: cells[1],
          dob: cells[2],
          service: cells[4],
          serviceDate: cells[6],
          patientId,
          serviceId,
        })
      }
    }

    logger.info(context, TAG, `services count: ${services.length}`)

    return ok(services)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function acceptPageService(context: IContext, page: Page, patientId: string, serviceId: string): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'acceptPageService']

  try {
    const jscode = `postThis('/mm/cc/apps/ccAll.mpl?v=services&patient_id=${patientId}&service_id=${serviceId}')`

    logger.debug(context, TAG, `evaluate: ${jscode}`)

    await page.evaluate((jsCode) => {
      eval(jsCode);
    }, jscode);

    await page.waitForTimeout(2000)
    await page.getByLabel('Service Status:').waitFor({ state: 'visible', timeout: 30000 })

    await page.waitForTimeout(2000)
    await page.getByLabel('Service Status:').selectOption('300');
    await page.waitForTimeout(2000)

    try {
      await page.getByLabel('Service Site:').selectOption('17763812');
    } catch (e) {
      logger.warn(context, TAG, 'Service Site: 17763812 not found, selecting Food Smart instead');

      await page.getByLabel('Service Site:').selectOption({label: 'Food Smart'});
    }

    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByText('Service Update Successful').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function declinePageService(context: IContext, page: Page, patientId: string, serviceId: string): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'declinePageService']

  try {
    await page.evaluate((jsCode) => {
      eval(jsCode);
    }, `postThis('/mm/cc/apps/ccAll.mpl?v=services&patient_id=${patientId}&service_id=${serviceId}}')`);

    await page.getByLabel('Service Status:').waitFor({ state: 'visible', timeout: 60000 })

    await page.waitForTimeout(2000)
    await page.getByLabel('Service Status:').selectOption('400');
    await page.waitForTimeout(2000)
    await page.getByLabel('Reason Code: Provider declined reason: Does Not Meet').selectOption('414');
    await page.waitForTimeout(2000)
    
    try {
      await page.getByLabel('Service Site:').selectOption('17763812');
    } catch (e) {
      logger.warn(context, TAG, 'Service Site: 17763812 not found, selecting Food Smart instead');

      await page.getByLabel('Service Site:').selectOption({label: 'Food Smart'});
    }

    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByText('Service Update Successful').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(2000)

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function inProgressPageService(context: IContext, page: Page, patientId: string, serviceId: string): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'inProgressPageService']

  try {
    const jscode = `postThis('/mm/cc/apps/ccAll.mpl?v=services&patient_id=${patientId}&service_id=${serviceId}')`

    await page.evaluate((jsCode) => {
      eval(jsCode);
    }, jscode);

    await page.getByLabel('Service Status:').waitFor({ state: 'visible', timeout: 30000 })

    await page.waitForTimeout(2000)
    await page.getByLabel('Service Status:').selectOption('500');
    await page.waitForTimeout(2000)
    
    try {
      await page.getByLabel('Service Site:').selectOption('17763812');
    } catch (e) {
      logger.warn(context, TAG, 'Service Site: 17763812 not found, selecting Food Smart instead');

      await page.getByLabel('Service Site:').selectOption({label: 'Food Smart'});
    }

    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'Save' }).click();

    await page.getByText('Service Update Successful').waitFor({ state: 'visible', timeout: 30000 })

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function completePageService(context: IContext, page: Page, patientId: string, serviceId: string, appointmentDate: Date): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'completePageService']

  try {
    const jscode = `postThis('/mm/cc/apps/ccAll.mpl?v=services&patient_id=${patientId}&service_id=${serviceId}')`

    //
    // Must be MM/dd/yyyy format when submitted.
    //
    const appointmentDateStr = DateTime.fromJSDate(appointmentDate).toFormat('MM/dd/yyyy')

    logger.info(context, TAG, 'evaluating:', {
      jscode,
      appointmentDate,
      appointmentDateStr,
    })

    await page.evaluate((jsCode) => {
      eval(jsCode);
    }, jscode);

    await page.waitForTimeout(2000)
    await page.getByLabel('Service Status:').waitFor({ state: 'visible', timeout: 30000 })

    await page.waitForTimeout(2000)
    await page.getByLabel('Service Status:').selectOption('600');
    await page.waitForTimeout(2000)
    await page.getByLabel('Reason Code:').selectOption('613');
    await page.waitForTimeout(2000)
    await page.getByLabel('Discharge Date:').fill(appointmentDateStr)
    await page.waitForTimeout(2000)
    
    try {
      await page.getByLabel('Service Site:').selectOption('17763812');
    } catch (e) {
      logger.warn(context, TAG, 'Service Site: 17763812 not found, selecting Food Smart instead');

      await page.getByLabel('Service Site:').selectOption({label: 'Food Smart'});
    }

    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('Service Update Successful').waitFor({ state: 'visible', timeout: 60000 })
    await page.waitForTimeout(2000)

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface CalOptimaService {
  cin: string,
  taskDate: string,
  appointmentDate: string,
  serviceRequestDescription: string,
  taskDescription: string,
  note: string,
  agencyRelationship: string,
  referredBy: string,
  benefitExhausted: boolean,
  dischargePlan: boolean,
  medicalConditions: MedicalCondition[],
  otherMedicalConditionDescription?: string,
  utilizationCriteria: UtilizationCriteria[],
  careCoordinationNeedDescription?: string,
  specialDiet: boolean,
  specialDietDescription?: string,
  otherDeliveryServices: boolean,
  hasFridge: boolean,
  hasReheat: boolean,
}

async function searchByCIN(context: IContext, page: Page, cin: string): Promise<Result<void, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'searchByCIN'];

  try {
    logger.debug(context, TAG, 'Searching by cin.', {
      cin,
    })

    const jscode = `postThis('/mm/cc/apps/cc.mpl')`;

    logger.info(context, TAG, 'evaluating:', {
      jscode,
      cin,
    });

    await page.evaluate((jsCode) => {
      eval(jsCode);
    }, jscode);

    await page.locator('#search-cin').fill(cin); // locator in the CIN search text field

    await page.click('button.primary:has-text("Search")'); // Click the "Search" button

    await waitForLoader(page);
    await page.waitForTimeout(1000);

    await page.waitForSelector(`tr:has-text("${cin}")`, { timeout: 60000 });
    await page.locator(`tr:has-text("${cin}")`).first().click({ timeout: 60000 }); // Click the first row that has a CIN match (in case it's also in recent)

    await waitForLoader(page);
    await page.waitForTimeout(1000);

    // Wait until we are on the correct patient details page
    await page.waitForFunction((cin) => {
      return Array.from(document.querySelectorAll('div.col-patient-ovw')).some(column =>
        column.querySelector('div.labelText')?.textContent?.trim() === "CIN:" &&
        column.querySelector('div.labelled-data')?.textContent?.trim() === cin
      );
    }, cin);

    logger.debug(context, TAG, 'Completed search by cin.', {
      cin,
    })

    return ok(undefined);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

async function addService(context: IContext, page: Page, service: CalOptimaService, dryRun = false): Promise<Result<void, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'addService'];

  try {
    logger.debug(context, TAG, 'Adding service.', {
      service,
    })

    await page.locator('#pat-tab-services').click(); // Click the "Our Services (N)" tab

    await waitForLoader(page);
    await page.waitForTimeout(1000);

    await page.locator('button.primary:has-text("Service")').click(); // Click the "+ Service" button

    await waitForLoader(page);
    await page.waitForTimeout(1000);

    await page.locator('#modal-service-cat').selectOption('Resource/Linkage Services');  // Category

    await waitForLoader(page);

    await page.locator('#modal-service-need').selectOption('CACS: Medically Tailored Meals'); // Need

    await waitForLoader(page);

    await page.locator('#modal-service-prov').selectOption('Food Smart'); // Provider

    await waitForLoader(page);

    await page.locator('#ccSvcStatusSelect').selectOption('Requested');  // Status

    await waitForLoader(page);

    await page.locator('#modal-task-type').selectOption('Coordination to Link to Community Resources');  // Task Type

    await page.locator('#modal-task-date').fill(service.taskDate); // Task Date
    await page.locator('#modal-appt_date').fill(service.appointmentDate); // Appointment Date
    await page.locator('[name="cs$description"]').fill(service.serviceRequestDescription); // Description of Service Request
    await page.locator('[name="cst$description"]').fill(service.taskDescription); // Description of Task
    await page.locator('[name="csn$note"]').fill(service.note);  // Note
    // Referral Information Section
    await page.locator('[name="csr$referrer_rel"]').fill(service.agencyRelationship); // Agency/Relationship to Member
    await page.locator('[name="csr$referred_by"]').fill(service.referredBy); // Referred By

    // MTM Options Section
    await page.locator('[name="csr$benefit_exhausted"]').selectOption(service.benefitExhausted ? 'Yes' : 'No'); // Has member received medically tailored meals from CalAIM?

    if (service.dischargePlan) {
      await page.locator('label[for="refCafdDischargePlan"]').check(); // Member is currently in the hospital or nursing facility and Medically Tailored Meals are a part of the discharge plan (expedites request)
    }

    for (const condition of service.medicalConditions) {
      await page.locator(`label[for="${MEDICAL_CONDITION_LABEL_MAP[condition]}"]`).check();
    }

    if (service.medicalConditions.includes('Other')) {
      if (!service.otherMedicalConditionDescription) {
        logger.error(context, TAG, "Required medical condition description for 'Other' not provided");

        return err(ErrCode.EXCEPTION);
      } else {
        await page.locator('#refCafdOtherMedDesc').fill(service.otherMedicalConditionDescription); // Required medical condition description for "Other"
      }
    }

    for (const criteria of service.utilizationCriteria) {
      await page.locator(`label[for="${UTILIZATION_CRITERIA_LABEL_MAP[criteria]}"]`).check();
    }

    if (service.utilizationCriteria.includes('Extensive Care Coordination Needs')) {
      if (!service.careCoordinationNeedDescription) {
        logger.error(context, TAG, "Required care coordination description for 'Member has extensive care coordination needs' not provided");

        return err(ErrCode.EXCEPTION);
      } else {
        await page.locator('#refCafdCoordDesc').fill(service.careCoordinationNeedDescription); // Required care coordination description for "Member has extensive care coordination needs"
      }
    }

    await page.locator('[name="csr$cafd_diet"]').selectOption(service.specialDiet ? 'Yes' : 'No'); // Member on a special diet? Yes/No

    if (service.specialDiet) {
      if (!service.specialDietDescription) {
        logger.error(context, TAG, "Required special diet description not provided");

        return err(ErrCode.EXCEPTION);
      } else {
        await page.locator('#refCafdDietDesc').fill(service.specialDietDescription); // If yes, required special diet description
      }
    }

    if (service.otherDeliveryServices) {
      await page.locator('label[for="refCafdOtherDelivery"]').check(); // Member is receiving other meal delivery services from local, state or federally funded programs.
    }

    await page.locator('[name="csr$cafd_fridge"]').selectOption(service.hasFridge ? 'Yes' : 'No'); // Has a fridge? Yes/No

    await page.locator('[name="csr$cafd_reheat"]').selectOption(service.hasReheat ? 'Yes' : 'No'); // Has a way to safely reheat meals? Yes/No

    if (dryRun) {
      // Don't actually submit the service request
      await page.locator('button.float-right:has-text("Close")').click(); // Click the close button
    } else {
      // Submit the service request
      await page.locator('button.primary:has-text("Submit")').click(); // Click the submit button

      await waitForLoader(page);

      await page.getByText('Referral Insert Successful').waitFor({ state: 'visible', timeout: 30000 });
    }

    logger.debug(context, TAG, 'Successfully added service.', {
      service,
    })

    return ok(undefined);
  }
  catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

async function addAssessment(context: IContext, page: Page, assessment: CalOptimaReferral, dryRun = false): Promise<Result<void, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'addAssessment'];

  try {
    logger.debug(context, TAG, 'Adding assessment.', {
      assessment,
    })

    await page.locator('#pat-tab-assess').click(); // Click the "Assessments" tab

    await waitForLoader(page);

    // Locate the MTM header
    const header = page.locator('div.header-sm:has-text("Medically Tailored Meals Summary")');

    // Click the "Add New" button within the same panel container to add an MTM assessment
    await header.locator('.. >> button.float-right').click();

    await waitForLoader(page);
    await page.waitForTimeout(500);

    await page.getByLabel('Tier:').selectOption(TIER_MAPPING[assessment.riskScore]);
    await page.waitForTimeout(500);

    if (TIER_MAPPING[assessment.riskScore] === TIER_MAPPING.low && !assessment.diagnosisIcd10) {
      assessment.diagnosisIcd10 = 'Z71.3';
    }

    await page.getByRole('textbox', { name: 'Diagnosis:' }).click();
    await page.getByRole('textbox', { name: 'Diagnosis:' }).fill(assessment.diagnosisIcd10 ?? '');
    await page.waitForTimeout(500);
    await page.waitForSelector('#ui-id-1 > li:first-child > div');
    await page.click('#ui-id-1 > li:first-child > div');
    await page.waitForTimeout(500);

    await page.getByRole('textbox', { name: 'Dietitian Recommendation' }).click();
    await page.getByRole('textbox', { name: 'Dietitian Recommendation' }).fill(assessment.dietitianRecommendation ?? '');
    await page.waitForTimeout(500);

    const icdCode = await page.getByRole('textbox', { name: 'ICD Code:' }).inputValue();
    logger.info(context, TAG, 'ICD Code:', { icdCode });

    if (TIER_MAPPING[assessment.riskScore] !== TIER_MAPPING.low) {
      if (assessment.foodBenefit === 'mtm') {
        await page.getByText('Delivered Meals').click();
        await page.getByLabel('Quantity/Volume: 2 meals per').selectOption(assessment.frequency);
        await page.getByLabel('Duration:').selectOption(assessment.duration);
      } else if (assessment.foodBenefit === 'grocery_box') {
        await page.getByText('Weekly Grocery Box').click();
        await page.getByLabel('Quantity/Volume: 1 grocery').selectOption(assessment.frequency);
        await page.getByLabel('Duration:').selectOption(assessment.duration);
      }

      // default to all allergies if unknown
      if (assessment.allergies === undefined) {
        assessment.allergies = ['gluten', 'dairy', 'egg', 'fish', 'shellfish', 'soy', 'treenut', 'peanut'];
      }

      if (assessment.allergies.includes('none')) {
        assessment.allergies = [];
      }

      for (let allergy of assessment.allergies) {
        if (allergy in ALLERGY_CHECKBOX_MAPPING) {
          await page.getByText(ALLERGY_CHECKBOX_MAPPING[allergy], { exact: allergy === 'fish' }).click();
        }
      }

      if (!(assessment.mechanicalAlteredDiet in MECHANICALLY_ALTERED_DIET_MAPPING)) {
        logger.error(context, TAG, `mechanical_altered_diet: ${assessment.mechanicalAlteredDiet} not found in mapping`);

        return err(ErrCode.EXCEPTION);
      }

      await page.getByLabel('Mechanical Altered Diet: Low').selectOption(MECHANICALLY_ALTERED_DIET_MAPPING[assessment.mechanicalAlteredDiet]);

      if (assessment.specialRequest !== undefined) {
        await page.getByText(assessment.specialRequest).click();
      }

      if (assessment.dietitianRecommendation !== undefined) {
        await page.getByRole('textbox', { name: 'Dietitian Recommendation' }).click();
        await page.getByRole('textbox', { name: 'Dietitian Recommendation' }).fill(assessment.dietitianRecommendation);
      }
    }

    const date = new Date(assessment.serviceDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    await page.getByLabel('Date Medically Tailored Meals').click();
    await page.getByLabel('Date Medically Tailored Meals').fill(date);
    await page.getByLabel('Date Medically Tailored Meals').press('Tab');

    if (dryRun) {
      // Don't actually submit the assessment
      await page.getByRole('button', { name: 'Cancel' }).click();
    } else {
      // Submit the assessment      
      await Promise.all([
        page.waitForFunction(() => {
          const el = document.getElementById('mmMessagePane');
          return el && el.innerHTML.includes('Form Insert Successful') && window.getComputedStyle(el).opacity === '1';
        }, { timeout: 30000 }),  // Wait for the success message content and visibility

        page.getByRole('button', { name: 'Complete' }).click()
      ]);
    }

    await waitForLoader(page);

    logger.debug(context, TAG, 'Added assessment.', {
      assessment,
    })

    return ok(undefined);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

async function transferToMTM(context: IContext, page: Page, referral: CalOptimaReferral, dryRun = false): Promise<Result<void, ErrCode>> {
  const { config, logger } = context;
  const TAG = [...MTAG, 'transferToMTM'];

  try {
    logger.debug(context, TAG, 'Creating external referral.', {
      referral,
    })

    const referralConfig = config.common.referrals?.find(r => r.source === 'cal-optima')

    if (!referralConfig) {
      logger.error(context, TAG, 'Referral config is required.', {
        referral,
      })

      return err(ErrCode.INVALID_CONFIG)
    }

    await page.locator('#pat-tab-services').click(); // Click the "Our Services (N)" tab

    await waitForLoader(page);

    // Find the requested service option that contains "Requested" and the most recent date in MM/DD/YYYY format

    // Wait until the select service element has at least one option loaded
    await page.waitForFunction(() => {
      const options = document.querySelectorAll('#cplan-service-select option');
      return options && options.length > 0;
    });

    await page.waitForTimeout(1000);

    const optionTexts = await page.locator('#cplan-service-select option').allInnerTexts();

    // Filter options that contain "Requested"
    const requestedOptions = optionTexts.filter(option => option.includes('Requested'));

    // Parse the date and sort to find the most recent date
    const dateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;

    try {
      requestedOptions.sort((a, b) => {
        const matchA = a.match(dateRegex);
        const matchB = b.match(dateRegex);

        // Ensure match is found before proceeding
        if (!matchA || !matchB) {
          logger.error(context, TAG, "Date not found in one or both strings", {
            referral,
            a,
            b,
          });

          throw new Error("Date not found in one or both strings"); // this needs to be a throw to break out of the sort
        }

        const dateA = new Date(matchA[0]);
        const dateB = new Date(matchB[0]);

        // Sort in descending order
        return dateB.getTime() - dateA.getTime();
      });
    }
    catch (e) {
      logger.exception(context, TAG, e)

      return err(ErrCode.STATE_VIOLATION)
    }

    // Select the most recent "Requested" option
    if (requestedOptions.length > 0) {
      await page.locator('#cplan-service-select').selectOption(requestedOptions[0]);
    } else {
      logger.error(context, TAG, "No 'Requested' option found", {
        referral,
        optionTexts,
      });

      return err(ErrCode.NOT_FOUND)
    }

    await waitForLoader(page);

    await page.locator('button', { hasText: /Transfer to MTM/i }).click();  // Click the "Transfer to MTM" button

    await page.locator('#modal-service-prov').selectOption({ value: referral.foodVendorOption });  // Provider

    await waitForLoader(page);

    if (referral.description) {
      await page.locator('[name="cs$description"]').fill(referral.description); // Description of Service Request
    } else {
      logger.error(context, TAG, "Description of Service Request is required", {
        referral,
      });

      return err(ErrCode.INVALID_DATA)
    }

    if (referral.message) {
      await page.locator('[name="ms$body"]').fill(referral.message); // Message to receiving org
    }

    // Wait for the table to be loaded using the data-nc-qsf-name attribute
    await page.waitForSelector('div[data-nc-qsf-name="Medically Tailored Meals Summary"] table.dataTable');

    // Get all assesement rows from the table
    const rows = (await page.locator('div[data-nc-qsf-name="Medically Tailored Meals Summary"] table.dataTable tbody tr').all()).slice(1);

    // Extract assessment dates and their corresponding rows
    const datesAndRows = await Promise.all(
      rows.map(async (row) => {
        const dateText = await row.locator('td:nth-child(7)').innerText();
        const date = new Date(dateText);
        return { date, row };
      })
    );

    // Sort assessment rows by date in descending order
    datesAndRows.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Select the assesment row with the latest date
    const latestRow = datesAndRows[0].row;

    // Click the checkbox for the latest assessment
    const checkBoxId = await latestRow.locator('td:nth-child(8) input[type="checkbox"]').getAttribute('id');
    await page.locator(`label[for="${checkBoxId}"]`).check();

    if (dryRun) {
      // Don't actually submit the transfer
      await page.getByRole('button', { name: 'Close' }).click();
    } else {
      // Submit the transfer
      await page.getByRole('button', { name: 'Submit' }).click();

      await waitForLoader(page);

      await page.getByText('Service Update Successful').waitFor({ state: 'visible', timeout: 30000 });
    }

    logger.debug(context, TAG, 'Created external referral.', {
      referral,
    })

    return ok(undefined);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

enum CloseServiceSubstatus {
  AuthorizationDenied = 659,
  BenefitExhausted = 660,
  CurrentlyInRecuperativeCare = 603,
  DischargeFromRC_EmergencyShelter = 619,
  DischargeFromRC_Hospital = 620,
  DischargeFromRC_InterimHousing = 618,
  DischargeFromRC_MedicalTransition = 632,
  DischargeFromRC_NonCompliance = 623,
  DischargeFromRC_PermanentHousing = 617,
  DischargeFromRC_SelfExit = 621,
  DischargeFromRC_StayCompleted = 626,
  DuplicativeProgram = 638,
  EmergencyShelter = 604,
  FollowUpScheduled = 605,
  Incarcerated = 640,
  InterimHousing = 607,
  LeftAMA = 622,
  MemberDeceased = 639,
  MemberDeclinedServices = 602,
  MemberHousedElsewhere = 627,
  MemberLostMediCalCoverage = 628,
  MemberNoLongerEligibleForServices = 647,
  MemberNoLongerNeedsServices = 614,
  MemberNotReauthorizedForServices = 645,
  MoveInBundlePaid = 625,
  MovedOutOfCountry = 643,
  MovedOutOfCounty = 642,
  MTMBenefitExhausted = 661,
  PermanentHousingPlacementSustained = 609,
  PhoneNumberNoLongerValid = 610,
  ReassignedToOtherCommunitySupportsProvider = 646,
  ReferToHospital = 606,
  SelfExit = 611,
  ServiceOnHold = 612,
  ServiceReceived = 613,
  ServiceTransferred = 631,
  ServicesNotCompleted = 615,
  SwitchedHealthPlans = 641,
  UnableToReachMember = 601,
  UnsafeBehaviorOrEnvironment = 644,
  Other = 616,
  ECM_MetAllCarePlanGoals = 634,
  ECM_ReadyToTransitionToLowerCare = 635,
  ECM_NoLongerWishesToReceiveECM = 636,
  ECM_NotAbleToConnectWithMember = 637,
  ECM_Incarcerated = 648,
  ECM_MemberDeclinedToParticipate = 649,
  ECM_DuplicativeProgram = 650,
  ECM_MemberLostMediCalCoverage = 651,
  ECM_SwitchedHealthPlans = 652,
  ECM_MovedOutOfCountry = 653,
  ECM_MovedOutOfCounty = 654,
  ECM_UnsafeBehaviorOrEnvironment = 655,
  ECM_MemberNotReauthorizedForServices = 656,
  ECM_MemberDeceased = 657,
  ECM_Other = 658
}

interface CloseServiceOptions {
  substatus?: CloseServiceSubstatus,
  dischargeDate?: Date,
}

async function closeCurrentService(context: IContext, page: Page, referral: CalOptimaReferral, options?: CloseServiceOptions): Promise<Result<void, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'closeCurrentService'];

  const opt = {
    substatus: options?.substatus ?? CloseServiceSubstatus.ServiceTransferred,
    dischargeDate: options?.dischargeDate ?? new Date(),
  };

  const substatusName = Object
    .keys(CloseServiceSubstatus)
    .find(x => CloseServiceSubstatus[x as keyof typeof CloseServiceSubstatus] === opt.substatus);

  try {
    const date = opt.dischargeDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    logger.debug(context, TAG, `Closing service for referral with substatus ${substatusName}-${opt.substatus} and date ${date}.`, {
      referral,
    });

    await page.waitForSelector('#cplan-service-status', { state: 'visible' });
    await page.selectOption('#cplan-service-status', { value: '600' });

    await waitForLoader(page);

    await page.waitForSelector('#substatus_id', { state: 'visible' });
    await page.selectOption('#substatus_id', { value: opt.substatus.toString() });

    let hasDateField = false;
    try {
      await page.waitForSelector('#substatus_discharge', { state: 'visible', timeout: 3000 });
      hasDateField = true;
    } catch (e) {
      logger.debug(context, TAG, `Date field not present for substatus ${substatusName}-${opt.substatus}, skipping.`);
    }

    if (hasDateField) {
      await page.fill('#substatus_discharge', date);
    }

    await page.waitForSelector('button.button-sm:has-text("Save")', { state: 'visible' });
    await page.click('button.button-sm:has-text("Save")');

    await waitForLoader(page);

    await page.getByText('Service Update Successful').waitFor({ state: 'visible', timeout: 30000 });
    
    return ok(undefined);
  } catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

function createMockServices(): Service[] {
  return [{
    "firstName": "ALICIA",
    "lastName": "SMITH",
    "dob": new Date("1962-12-27"),
    "service": "",
    "serviceDate": new Date("2024-05-01T12:19:11.000Z"),
    "patientId": "ID:69EBA9B60416741DE053D304000A0000",
    "serviceId": "ID:176A4A17EAA6107AE063D304000A682F"
  },
  {
    "firstName": "KHOAT",
    "lastName": "TRAM",
    "dob": new Date("1940-06-02"),
    "service": "",
    "serviceDate": new Date("2024-05-01T14:07:17.000Z"),
    "patientId": "ID:69EBA9B020AC741DE053D304000A1111",
    "serviceId": "ID:176BD166DACE1523E063D304000AAAAA"
  },
  {
    "firstName": "KHOAT",
    "lastName": "DUN",
    "dob": new Date("1940-06-02"),
    "service": "",
    "serviceDate": new Date("2024-05-01T14:07:17.000Z"),
    "patientId": "ID:69EBA9B020AC741DE053D304000A1112",
    "serviceId": "ID:176BD166DACE1523E063D304000AAAAA"
  }]
}

type Service = {
  firstName: string,
  lastName: string,
  dob: Date,
  service: string,
  serviceDate: Date,
  patientId: string,
  serviceId: string,
}

export interface GetServicesOptions {
  sourceContext?: CaloptimaConnectContext
}

export async function getServices(context: IContext, options?: GetServicesOptions): Promise<Result<Service[], ErrCode>> {
  const { config, logger } = context
  const TAG = [...MTAG, 'getServices']

  try {
    if (!config.isProduction) {
      return ok(createMockServices())
    }

    const ccContextResult: CaloptimaConnectContext | ErrCode = (options?.sourceContext) ?
      options.sourceContext :
      await (async () => {
        const result = await createCaloptimaConnectContext(context)

        if (result.isErr()) {
          return result.error
        }
        return result.value
      })()

    if (typeof ccContextResult === "number") {
      logger.error(context, TAG, 'Caloptima Connect Context is required.', {
        error: ccContextResult,
      })

      return err(ccContextResult)
    }

    const {
      browser,
      browserContext,
      page
    } = ccContextResult

    const getServicesResult = await getPageServices(context, page)

    if (getServicesResult.isErr()) {
      logger.error(context, TAG, 'Error getting services.')

      return err(getServicesResult.error)
    }

    const services: Service[] = []

    for (const service of getServicesResult.value) {
      logger.info(context, TAG, 'Page service.', service)

      const dob = DateTime.fromFormat(service.dob, 'MM/dd/yyyy', { zone: 'UTC' }).toJSDate()
      //
      // Service dates: "05/03/2024 09:00 AM"
      //
      const serviceDate = DateTime.fromFormat(service.serviceDate, 'MM/dd/yyyy hh:mm a', { zone: 'UTC' }).toJSDate()

      services.push({
        firstName: service.firstName,
        lastName: service.lastName,
        dob,
        service: service.service,
        serviceDate,
        patientId: service.patientId,
        serviceId: service.serviceId,
      })
    }

    if (ccContextResult !== options?.sourceContext) {
      //
      // New context was created and not passed in. Destroy it.
      //

      const destroyResult = await destroyCaloptimaConnectContext(context, ccContextResult)

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        })
      }
    }

    return ok(services)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export enum ServiceStatus {
  'ACCEPTED' = 'accepted',
  'DECLINED' = 'declined',
  'IN_PROGRESS' = 'in-progress',
  'COMPLETED' = 'completed',
}

export interface UpdateServiceStatusOptions {
  dryRun?: boolean,
  sourceContext?: CaloptimaConnectContext,
  appointmentDate?: Date,
}

export async function updateServiceStatus(context: IContext, patientId: string, serviceId: string, status: ServiceStatus, options?: UpdateServiceStatusOptions): Promise<Result<void, ErrCode>> {
  const { config, logger } = context
  const TAG = [...MTAG, 'setServiceStatus']

  try {
    //
    // if (!config.isProduction) {
    //
    // Only update in production.
    //
    //  logger.info(context, TAG, `Updating service status in non-production environment.`, {
    //    patientId,
    //    serviceId,
    //    status,
    //  })
    //
    //  return err(ErrCode.ENVIRONMENT_NOT_SUPPORTED)
    // }

    const isDryRun = options?.dryRun ?? false

    if (isDryRun) {
      logger.debug(context, TAG, `Updating status in dry run mode.`, {
        patientId,
        serviceId,
        status,
      })

      return ok(undefined)
    }

    const ccContextResult: CaloptimaConnectContext | ErrCode = (options?.sourceContext) ?
      options.sourceContext :
      await (async () => {
        const result = await createCaloptimaConnectContext(context)

        if (result.isErr()) {
          return result.error
        }
        return result.value
      })()

    if (typeof ccContextResult === "number") {
      logger.error(context, TAG, 'Caloptima Connect Context is required.', {
        error: ccContextResult,
      })

      return err(ccContextResult)
    }

    const {
      page
    } = ccContextResult

    let result: Result<void, ErrCode>

    if (status === ServiceStatus.ACCEPTED) {
      result = await acceptPageService(context, page, patientId, serviceId)
    }
    else if (status === ServiceStatus.DECLINED) {
      result = await declinePageService(context, page, patientId, serviceId)
    }
    else if (status === ServiceStatus.IN_PROGRESS) {
      result = await inProgressPageService(context, page, patientId, serviceId)
    }
    else if (status === ServiceStatus.COMPLETED) {
      if (options?.appointmentDate === undefined) {
        logger.error(context, TAG, 'Completing page service requires an appointment date.', {
          patientId,
          serviceId,
          options,
        })

        return err(ErrCode.INVALID_DATA)
      }
      result = await completePageService(context, page, patientId, serviceId, options.appointmentDate)
    }
    else {
      logger.error(context, TAG, 'Unsupported service status.', {
        patientId,
        serviceId,
        status,
      })

      result = err(ErrCode.NOT_IMPLEMENTED)
    }

    if (ccContextResult !== options?.sourceContext) {
      //
      // New context was created and not passed in. Destroy it.
      //
      const destroyResult = await destroyCaloptimaConnectContext(context, ccContextResult)

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        })
      }
    }

    if (result.isErr()) {
      logger.error(context, TAG, 'Error updating patient service status.', {
        patientId,
        serviceId,
        error: result.error
      })

      return err(result.error)
    }

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

const TIER_MAPPING = {
  'low': '1',
  'medium': '2',
  'high': '3',
}

const ALLERGY_CHECKBOX_MAPPING = {
  gluten: 'Wheat',
  wheat: 'Wheat',
  dairy: 'Milk',
  egg: 'Eggs',
  fish: 'Fish',
  shellfish: 'Shellfish',
  soy: 'Soy',
  tree_nut: 'Tree nuts (eg. Walnuts,',
  treenut: 'Tree nuts (eg. Walnuts,',
  peanut: 'Peanuts',
  sesame: 'Sesame'
}

export const MECHANICALLY_ALTERED_DIET_MAPPING = {
  'heart_friendly': 'Cardiac/Heart Friendly',
  'diabetic_friendly': 'Diabetic Friendly',
  'renal_friendly': 'Renal Friendly',
  'gluten_free': 'Gluten Free',
  'low_na': 'Low NA',
  'cancer_supports_calories': 'Cancer Supports Calories',
  'lactose_free': 'Lactose free',
  'low_carb': 'Low Carb',
  'vegetarian': 'Vegetarian',
  'allergy_free': 'Allergy Free',
  'low_residue_diet': 'Low Residue Diet',
}

export type MedicalCondition = 'Diabetes' | 'Auto Immune Disorder' | 'Kidney Disease' | 'Heart Failure' | 'Liver Disease' |
  'Stroke' | 'Cancer' | 'COPD' | 'Obesity' | 'High Cholesterol' | 'Hypertension' | 'Arthritis' | 'Gout' | 'IBD' |
  'Mental Health' | 'Food Allergy' | 'Neurocognitive Disorder' | 'Chewing Difficulty' | 'Other';

const MEDICAL_CONDITION_LABEL_MAP = {
  'Diabetes': 'refCafdDiabetes',
  'Auto Immune Disorder': 'refCafdAutoImm',
  'Kidney Disease': 'refCafdKidney',
  'Heart Failure': 'refCafdHeart',
  'Liver Disease': 'refCafdLiver',
  'Stroke': 'refCafdStroke',
  'Cancer': 'refCafdCancer',
  'COPD': 'refCafdCopd',
  'Obesity': 'refCafdObesity',
  'High Cholesterol': 'refCafdCholesterol',
  'Hypertension': 'refCafdHypertension',
  'Arthritis': 'refCafdArthritis',
  'Gout': 'refCafdGout',
  'IBD': 'refCafdIbd',
  'Mental Health': 'refCafdMhBhv',
  'Food Allergy': 'refCafdAllergy',
  'Neurocognitive Disorder': 'refCafdNeurocog',
  'Chewing Difficulty': 'refCafdChewing',
  'Other': 'refCafdOtherMed',
};

export type UtilizationCriteria = 'Recently Discharged' | 'High Risk of Hospitalization' | 'Extensive Care Coordination Needs';

const UTILIZATION_CRITERIA_LABEL_MAP = {
  'Recently Discharged': 'refCafdDischarge',
  'High Risk of Hospitalization': 'refCafdRisk',
  'Extensive Care Coordination Needs': 'refCafdCoord',
};

export interface CalOptimaReferral {
  patientId: string,
  serviceId: string,
  foodVendorOption: string, // Option value.
  foodVendorName?: string,
  riskScore: string,
  diagnosisIcd10?: string,
  foodBenefit: string,
  frequency: string,
  duration: string,
  allergies?: string[],
  mechanicalAlteredDiet: string,
  specialRequest?: string,
  dietitianRecommendation?: string,
  serviceDate: string,
  description?: string,
  message?: string,
}

export interface CreateReferralOptions {
  sourceContext?: CaloptimaConnectContext,
}

export async function createReferral(context: IContext, referral: CalOptimaReferral, options?: CreateReferralOptions): Promise<Result<void, ErrCode | string>> {
  const { config, logger } = context
  const TAG = [...MTAG, 'createReferral']

  try {
    //
    // if (!config.isProduction) {
    //
    // Only update in production.
    //
    //  logger.info(context, TAG, `Creating referral in non-production environment.`, {
    //    referral,
    //  })
    //
    //  return err(ErrCode.ENVIRONMENT_NOT_SUPPORTED)
    // }
    //

    const ccContextResult: CaloptimaConnectContext | ErrCode = (options?.sourceContext) ?
      options.sourceContext :
      await (async () => {
        const result = await createCaloptimaConnectContext(context)

        if (result.isErr()) {
          return result.error
        }
        return result.value
      })()

    if (typeof ccContextResult === "number") {
      logger.error(context, TAG, 'Caloptima Connect Context is required.', {
        error: ccContextResult,
      })

      return err(ccContextResult)
    }

    const {
      page
    } = ccContextResult

    logger.info(context, TAG, 'Creating CalOptima referral.', {
      referral,
    })

    const partialPath = `/mm/cc/apps/ccAll.mpl?v=services&patient_id=${referral.patientId}&service_id=${referral.serviceId}`;
    const urlRegex = new RegExp(`/mm/cc/apps/ccAll\\.mpl\\?v=services&patient_id=${referral.patientId}&service_id=${referral.serviceId}`);

    await Promise.all([
      page.goto(new URL(partialPath, page.url()).toString()),
      page.waitForURL(urlRegex, { timeout: 30000, waitUntil: 'domcontentloaded' }),
    ]);

    const locator = page.locator('button', { hasText: /Transfer to MTM/i });
    const count = await locator.count();

    if (count === 0) {
      logger.error(context, TAG, `Transfer to MTM button not found`, {
        referral,
      })

      return err('page_missing_transfer_to_mtm')
    }

    await locator.click();

    await page.waitForTimeout(2000)

    const hasSummary = await page.$('div[data-nc-qsf-name="Medically Tailored Meals Summary"] .trLink') !== null

    if (!hasSummary) {
      let newPage

      try {
        // Create Summary

        const pagePromise = page.context().waitForEvent('page');
        await page.getByRole('button', { name: '✏ New Medically Tailored' }).click();

        newPage = await pagePromise;
        await newPage.waitForLoadState();

        await newPage.waitForTimeout(2000)
        await newPage.getByLabel('Tier:').selectOption(TIER_MAPPING[referral.riskScore]);
        await newPage.waitForTimeout(1000)

        await newPage.getByRole('textbox', { name: 'Diagnosis:' }).click();
        await newPage.getByRole('textbox', { name: 'Diagnosis:' }).fill(referral.diagnosisIcd10 ?? null);
        await newPage.waitForSelector('#ui-id-1 > li:first-child > div');
        await newPage.click('#ui-id-1 > li:first-child > div')
        await newPage.waitForTimeout(2000)

        if (referral.foodBenefit === 'mtm') {
          await newPage.getByText('Delivered Meals').click();
          await newPage.waitForTimeout(2000)
          await newPage.getByLabel('Quantity/Volume: 2 meals per').selectOption(referral.frequency);
          await newPage.waitForTimeout(1000)
          await newPage.getByLabel('Duration:').selectOption(referral.duration);
          await newPage.waitForTimeout(1000)
        } else if (referral.foodBenefit === 'grocery_box') {
          await newPage.getByText('Weekly Grocery Box').click();
          await newPage.waitForTimeout(2000)
          await newPage.getByLabel('Quantity/Volume: 1 grocery').selectOption(referral.frequency);
          await newPage.getByLabel('Duration:').selectOption(referral.duration);
          await newPage.waitForTimeout(1000)
        }

        // default to all allergies if unknown
        if (referral.allergies === undefined) {
          referral.allergies = ['gluten', 'dairy', 'egg', 'fish', 'shellfish', 'soy', 'treenut', 'peanut']
        }

        if (referral.allergies.includes('none')) {
          referral.allergies = []
        }

        for (let allergy of referral.allergies) {
          if (allergy in ALLERGY_CHECKBOX_MAPPING) {
            await newPage.getByText(ALLERGY_CHECKBOX_MAPPING[allergy], { exact: allergy === 'fish' }).click();
            await newPage.waitForTimeout(100)
          }
        }

        if (!(referral.mechanicalAlteredDiet in MECHANICALLY_ALTERED_DIET_MAPPING)) {
          logger.error(context, TAG, `mechanical_altered_diet: ${referral.mechanicalAlteredDiet} not found in mapping`, {
            referral,
          })

          return err('page_missing_mechanical_altered_diet')
        }

        await newPage.getByLabel('Mechanical Altered Diet: Low').selectOption(MECHANICALLY_ALTERED_DIET_MAPPING[referral.mechanicalAlteredDiet]);
        await newPage.waitForTimeout(2000)

        if (referral.dietitianRecommendation !== undefined) {
          await newPage.getByRole('textbox', { name: 'Dietitian Recommendation' }).click();
          await newPage.getByRole('textbox', { name: 'Dietitian Recommendation' }).fill(referral.dietitianRecommendation);
          await newPage.waitForTimeout(1000)
        }

        await newPage.getByLabel('Date Medically Tailored Meals').click();
        await newPage.getByLabel('Date Medically Tailored Meals').fill(referral.serviceDate);
        await newPage.getByLabel('Date Medically Tailored Meals').press('Tab');
        await newPage.waitForTimeout(1000)
        await newPage.getByRole('button', { name: 'Complete' }).click();
        await newPage.waitForTimeout(4000)
        await newPage.close();
        await page.waitForTimeout(3000)
        await page.getByRole('button', { name: 'Refresh' }).click();

      } catch (e) {
        if (newPage) {
          await newPage.close();
        }

        logger.error(context, TAG, `Error creating summary.`, {
          referral,
          error: e,
        })

        return err(ErrCode.EXCEPTION)
      }
    }

    await page.waitForTimeout(2000)
    await page.getByLabel('Provider:').selectOption(referral.foodVendorOption);
    await page.waitForTimeout(2000)

    if (referral.description !== undefined) {
      await page.getByLabel('Description of Service').click();
      await page.getByLabel('Description of Service').fill(referral.description);
      await page.waitForTimeout(2000)
    }

    if (referral.message !== undefined) {
      await page.getByLabel('Message to Receiving Org:').click();
      await page.getByLabel('Message to Receiving Org:').fill(referral.message);
      await page.waitForTimeout(2000)
    }

    await page.getByLabel('Referred By:').click();
    await page.getByLabel('Referred By:').fill('Foodsmart');
    await page.waitForTimeout(2000)
    await page.getByLabel('Agency/Relationship to Member').click();
    await page.getByLabel('Agency/Relationship to Member').fill('Foodsmart');
    // await page.waitForTimeout(2000)
    // await page.getByLabel('Referral source email:').click();
    // await page.getByLabel('Referral source email:').fill('support@foodsmart.com');
    await page.waitForTimeout(2000)

    const summaryLocator = page.getByRole('cell', { name: '' }).locator('label')

    const summaryCount = await summaryLocator.count()

    if (summaryCount === 0) {
      logger.error(context, TAG, `Summary labels not found.`, {
        referral,
      })

      return err('page_missing_summary_labels')
    }
    else if (summaryCount === 1) {
      await summaryLocator.click()
      await page.waitForTimeout(1000)
    }
    else if (summaryCount > 1) {
      logger.debug(context, TAG, 'Multiple summaries encounters.', {
        referral,
        summary_count: summaryCount,
      })
      await summaryLocator.first().click()
      await page.waitForTimeout(1000)
    }

    await page.getByRole('button', { name: 'Submit' }).click();
    await page.getByText('Referral Insert Successful').waitFor({ state: 'visible', timeout: 30000 })

    // get form_id

    // await page.waitForSelector('div.header-sm:has-text("Medically Tailored Meals Summary")');
    // const onclickAttribute = await page.getAttribute('div.header-sm:has-text("Medically Tailored Meals Summary") > tr.trLink', 'onclick');
    // const form_id = onclickAttribute?.match(/form_id=(\d+)/)?.[1];

    // return form_id

    if (ccContextResult !== options?.sourceContext) {
      //
      // New context was created and not passed in. Destroy it.
      //
      const destroyResult = await destroyCaloptimaConnectContext(context, ccContextResult)

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        })
      }
    }

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function closeLowRiskReferral(context: IContext, referral: CalOptimaReferral, service: CalOptimaService, options?: CreateReferralOptions): Promise<Result<void, ErrCode | string>> {
  const { logger } = context;
  const TAG = [...MTAG, 'closeLowRiskReferral'];

  try {
    const ccContextResult: CaloptimaConnectContext | ErrCode = (options?.sourceContext) ?
      options.sourceContext :
      await (async () => {
        const result = await createCaloptimaConnectContext(context)

        if (result.isErr()) {
          return result.error
        }
        return result.value
      })();

    if (typeof ccContextResult === "number") {
      logger.error(context, TAG, 'Caloptima Connect Context is required.', {
        error: ccContextResult,
      });

      return err(ccContextResult);
    };

    const { page } = ccContextResult;

    logger.info(context, TAG, 'Closing low risk CalOptima referral.', {
      referral,
    });

    const partialPath = `/mm/cc/apps/ccAll.mpl?v=services&patient_id=${referral.patientId}&service_id=${referral.serviceId}`;
    const urlRegex = new RegExp(`/mm/cc/apps/ccAll\\.mpl\\?v=services&patient_id=${referral.patientId}&service_id=${referral.serviceId}`);

    await Promise.all([
      page.goto(new URL(partialPath, page.url()).toString()),
      page.waitForURL(urlRegex, { timeout: 30000, waitUntil: 'domcontentloaded' }),
    ]);

    const addServiceResult = await addService(context, page, service);

    if (addServiceResult.isErr()) {
      logger.error(context, TAG, 'Error adding CalOptima service for low risk.');

      return err(addServiceResult.error);
    }

    /*
      Reason code should be: Member No Longer Eligible For Services
      Diagnosis should be: “Z71.3 Dietary counseling and surveillance”
     */

    const closeCurrentServiceResult = await closeCurrentService(context, page, referral, {
      substatus: CloseServiceSubstatus.MemberNoLongerEligibleForServices,
    });

    if (closeCurrentServiceResult.isErr()) {
      logger.error(context, TAG, 'Error closing CalOptima service for low risk.');

      return err(closeCurrentServiceResult.error);
    }

    const addAssessmentResult = await addAssessment(context, page, referral, false);

    if (addAssessmentResult.isErr()) {
      logger.error(context, TAG, 'Error adding CalOptima assessment for low risk.');

      return err(addAssessmentResult.error);
    }

    return ok(undefined);
  }
  catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export async function createReauthReferral(context: IContext, data: ReauthData, options?: PerformReferralActionsOptions): Promise<Result<void, ErrCode | string>> {
  const { config, logger } = context;
  const TAG = [...MTAG, 'createReauthReferral'];

  try {
    const ccContextResult: CaloptimaConnectContext | ErrCode = (options?.sourceContext) ?
      options.sourceContext :
      await (async () => {
        const result = await createCaloptimaConnectContext(context);

        if (result.isErr()) {
          return result.error;
        }
        return result.value;
      })();

    if (typeof ccContextResult === "number") {
      logger.error(context, TAG, 'Caloptima Connect Context is required.', {
        error: ccContextResult,
      });

      return err(ccContextResult);
    };

    const {
      page
    } = ccContextResult;

    page.setDefaultTimeout(30000);

    if (options?.dryRun && ccContextResult !== options?.sourceContext) {
      // Setup dialog handling for new context since cancelling an assessment creation will trigger a dialog
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
    }

    logger.info(context, TAG, 'Creating CalOptima reauthorization referral.', {
      data,
    });

    let searchByCINResult = await searchByCIN(context, page, data.service.cin);

    if (searchByCINResult.isErr()) {
      logger.warn(context, TAG, 'Could not find CalOptima patient by CIN, retrying after 15 seconds...');

      await page.waitForTimeout(15000);

      searchByCINResult = await searchByCIN(context, page, data.service.cin);

      if (searchByCINResult.isErr()) {
        logger.error(context, TAG, 'Error finding CalOptima patient by CIN on retry 1.');
      }
    }

    if (searchByCINResult.isErr()) {
      logger.warn(context, TAG, 'Could not find CalOptima patient by CIN, retrying again after 60 seconds...');

      await page.waitForTimeout(60000);

      searchByCINResult = await searchByCIN(context, page, data.service.cin);

      if (searchByCINResult.isErr()) {
        logger.error(context, TAG, 'Error finding CalOptima patient by CIN on retry 2.');

        return err(searchByCINResult.error);
      }
    }

    const addServiceResult = await addService(context, page, data.service, options?.dryRun);

    if (addServiceResult.isErr()) {
      logger.error(context, TAG, 'Error adding CalOptima service.');

      return err(addServiceResult.error);
    }

    const addAssessmentResult = await addAssessment(context, page, data.referral, options?.dryRun);

    if (addAssessmentResult.isErr()) {
      logger.error(context, TAG, 'Error adding CalOptima assessment.');

      return err(addAssessmentResult.error);
    }

    const transferToMTMResult = await transferToMTM(context, page, data.referral, options?.dryRun);

    if (transferToMTMResult.isErr()) {
      logger.error(context, TAG, 'Error transferring CalOptima service to MTM.');

      return err(transferToMTMResult.error);
    }

    if (!options?.dryRun) {
      let closeCurrentServiceResult = await closeCurrentService(context, page, data.referral);

      if (closeCurrentServiceResult.isErr()) {
        logger.error(context, TAG, `Error closing CalOptima reauth service. Waiting 15 seconds and retrying...`);

        await page.waitForTimeout(15000);

        closeCurrentServiceResult = await closeCurrentService(context, page, data.referral);
      }

      if (closeCurrentServiceResult.isErr()) {
        logger.error(context, TAG, `Error closing CalOptima reauth service. Waiting 60 seconds and retrying...`);

        await page.waitForTimeout(60000);

        closeCurrentServiceResult = await closeCurrentService(context, page, data.referral);
      }

      if (closeCurrentServiceResult.isErr()) {
        logger.error(context, TAG, `Error closing CalOptima reauth service for CIN ${data.service.cin}.`);
        // since the service was successfully created and transferred to MTM,
        // do not return an error because we want to update schedule referral action and NOT re-run this record
      }
    }

    if (ccContextResult !== options?.sourceContext) {
      // New context was created and not passed in. Destroy it.
      const destroyResult = await destroyCaloptimaConnectContext(context, ccContextResult);

      if (destroyResult.isErr()) {
        logger.error(context, TAG, 'Error destroying Caloptima Connect context.', {
          error: destroyResult.error,
        });
      }
    }

    return ok(undefined);
  }
  catch (e) {
    logger.exception(context, TAG, e);

    return err(ErrCode.EXCEPTION);
  }
}

export default {
  createCaloptimaConnectContext,
  destroyCaloptimaConnectContext,
  getServices,
  updateServiceStatus,
  createReferral,
  createReauthReferral,
}
