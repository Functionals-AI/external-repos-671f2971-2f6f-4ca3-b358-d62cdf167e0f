#!/bin/bash

SCRIPT_VERSION="0.1"
STATUS=0

function usage()
{
  echo "$0 [OPTIONS] <task definition ARN> <client> <e-file date> <e-file s3 ARN>"
  echo ""
  echo "Options:"
  echo ""
  echo "  -h | --help"
  echo "  -v | --version"
  echo "  -c | --commit       Whether to commit changes. Default is to do a dry run."
  echo ""
  echo "<task definition ARN> The ECS scripts task definition arn. Note, this changes with each deployment."
  echo "                      IE: arn:aws:ecs:us-west-2:495477141215:task-definition/app-ECSScriptsTask-VaVY41dhizi1:1"
  echo ""
  echo "<client>              The client import is being performed form."
  echo ""
  echo "                      <client> ::= 'aetna-abhil'      |"
  echo "                                   'aetna-medicare'   |"
  echo "                                   'aetna-mtbank'     |"
  echo "                                   'aahhealthyliving' |"
  echo "                                   'amazon-cigna'     |"
  echo "                                   'bannerhealth'     |"
  echo "                                   'biomerieux'       |"
  echo "                                   'careoregon'       |"
  echo "                                   'cchp'             |"
  echo "                                   'caloptima'        |"
  echo "                                   'choc'             |"
  echo "                                   'cigna'            |"
  echo "                                   'countycare'       |"
  echo "                                   'elevance'         |"
  echo "                                   'elevance-food-benefit        |"
  echo "                                   'elevance-nutrition-education |"
  echo "                                   'fidelis'          |"
  echo "                                   'flblue'           |"
  echo "                                   'ih'               |"
  echo "                                   'martinspoint'     |"
  echo "                                   'mtbank'           |"
  echo "                                   'pacificsource'    |"
  echo "                                   'quartz'           |"
  echo "                                   'samaritan'        |"
  echo "                                   'tog'              |"
  echo "                                   'uhcdsnp'          |"
  echo "                                   'umpqua'"
  echo ""
  echo "<e-file date>         YYYY-MM-DD"
  echo "e-file S3 ARN>        S3 ARN of e-file to import."
  echo ""
  exit $STATUS
}

TASK_DEFINITION_ARN=''
CLIENT=''
EFILE_DATE=''
EFILE_S3_ARN=''
COMMIT=''

while [ "$1" != "" ]; do
  case $1 in
    -h | --help)
      usage
      ;;
    -v | --version)
      echo "version: $SCRIPT_VERSION"
      exit $STATUS
      ;;
    -c | --commit)
      COMMIT="\"--commit\","
      shift
      ;;
    -*)
      echo "Unknown option: $1"
      STATUS=1
      usage
      ;;
    *)
      break
      ;;
  esac
done

if [ $# -ne 4 ]; then
  echo "<task definition ARN>, <client>, <e-file date> and <e-file S3 ARN> are required!"
  STATUS=1
  usage
fi

TASK_DEFINITION_ARN=$1
CLIENT=$2
EFILE_DATE=$3
EFILE_S3_ARN=$4

#
# Variables to construct the container override command.
#
AETNA_ABHIL_SPEC='aetnaabhil'
AETNA_ABHIL_ORG_ID='202'
AETNA_ABHIL_ACCOUNT_ID='60'
AETNA_MEDICARE_SPEC='aetnama'
AETNA_MEDICARE_ORG_ID='170'
AETNA_MEDICARE_ACCOUNT_ID='27'
AETNA_MTBANK_SPEC='aetna-mtbank'
AETNA_MTBANK_ORG_ID='146'
AETNA_MTBANK_ACCOUNT_ID='50'
AAHHEALTHYLIVING_SPEC='aahhealthyliving'
AAHHEALTHYLIVING_ORG_ID='182'
AAHHEALTHYLIVING_ACCOUNT_ID='39'
AMAZON_CIGNA_SPEC='amazon-cigna'
AMAZON_CIGNA_ORG_ID='207'
AMAZON_CIGNA_ACCOUNT_ID='72'
BANNERHEALTH_SPEC='bannerhealth'
BANNERHEALTH_ORG_ID='200'
BANNERHEALTH_ACCOUNT_ID='37'
BIOMERIEUX_SPEC='vitality'
BIOMERIEUX_ORG_ID='85'
BIOMERIEUX_SUBORG_ID='biomerieux'
BIOMERIEUX_ACCOUNT_ID='43'
# updates
BRMC_SPEC='brmc'
BRMC_ORG_ID='212'
BRMC_ACCOUNT_ID='77'
# end updates
CALOPTIMA_SPEC='caloptima'
CALOPTIMA_ORG_ID='204'
CALOPTIMA_ACCOUNT_ID='61'
CAREOREGON_SPEC='careoregon'
CAREOREGON_ORG_ID='191'
CAREOREGON_ACCOUNT_ID='62'
CCHP_SPEC='cchp'
CCHP_ORG_ID='174'
CCHP_ACCOUNT_ID='9'
CHOC_SPEC='choc'
CHOC_ORG_ID='144'
CIGNA_SPEC='cignahealth'
CIGNA_ORG_ID='171'
COUNTYCARE_SPEC='countycare'
COUNTYCARE_ORG_ID='197'
COUNTYCARE_ACCOUNT_ID='46'
ELEVANCE_SPEC='anthemva'
ELEVANCE_ORG_ID='201'
ELEVANCE_ACCOUNT_ID='45'
ELEVANCE_FOOD_BENEFIT_SPEC='elevance-house'
ELEVANCE_FOOD_BENEFIT_ORG_ID='210'
ELEVANCE_FOOD_BENEFIT_ACCOUNT_ID='75'
ELEVANCE_NUTRITION_EDUCATION_SPEC='elevance-house'
ELEVANCE_NUTRITION_EDUCATION_ORG_ID='211'
ELEVANCE_NUTRITION_EDUCATION_ACCOUNT_ID='76'
FIDELIS_SPEC='fidelis'
FIDELIS_ORG_ID='208'
FIDELIS_ACCOUNT_ID='73'
FLBLUE_SPEC='flblue'
FLBLUE_ORG_ID='169'
FLBLUE_ACCOUNT_ID='35'
HSCSN_SPEC='hscsn'
HSCSN_ORG_ID='198'
HSCSN_ACCOUNT_ID='30'
IH_SPEC='ih'
IH_ORG_ID='8'
IH_ACCOUNT_ID='6'
MARTINSPOINT_SPEC='martinspointga'
MARTINSPOINT_ORG_ID='177'
MARTINSPOINT_ACCOUNT_ID='8'
MTBANK_SPEC='mt'
MTBANK_ORG_ID='146'
MTBANK_ACCOUNT_ID='50'
PACIFICSOURCE_SPEC='pacificsource'
PACIFICSOURCE_ORG_ID='172'
PACIFICSOURCE_ACCOUNT_ID='55'
QUARTZ_SPEC='quartz'
QUARTZ_ORG_ID='195'
QUARTZ_ACCOUNT_ID='56'
SAMARITAN_SPEC='samaritan'
SAMARITAN_ORG_ID='206'
SAMARITAN_ACCOUNT_ID='64'
TOG_SPEC='cchp'
TOG_ORG_ID='175'
TOG_ACCOUNT_ID='10'
UHCDSNP_SPEC='uhcdsnp'
UHCDSNP_ORG_ID='199'
UHCDSNP_ACCOUNT_ID='29'
UMPQUA_SPEC='umpqua'
UMPQUA_ORG_ID='184'
UMPQUA_ACCOUNT_ID='11'

CMD=''

#
# Create command:
#
#   flblue -> node,./scripts/eligibility/import-eligibility.es6,--spec,flblue,--addons,/dev/null,--organization_id,169,--file_date,10/03/2023,--outputs_path,s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/flblueImports_20231003/,--file,s3://zipongo-prod-eligibility-ready-us-west-2/flblue/FB_ZIPONGO_ENRL_PROD_2023_10_03.zESdt3sL.csv
#
function create_cmd()
{
  EFILE_DATE_MMDDYYYY=`echo $EFILE_DATE | awk 'BEGIN{FS="-"}{printf "%s/%s/%s", $2, $3, $1}'`
  EFILE_DATE_YYYYMMDD=`echo $EFILE_DATE | awk 'BEGIN{FS="-"}{print $1$2$3}'`

  if [[ $CLIENT = 'aetna-abhil' || $CLIENT = 'aetnaabhil' ]]; then 
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${AETNA_ABHIL_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${AETNA_ABHIL_ORG_ID}\",\"--account_id\",\"${AETNA_ABHIL_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'aetna-medicare' ]]; then 
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${AETNA_MEDICARE_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${AETNA_MEDICARE_ORG_ID}\",\"--account_id\",\"${AETNA_MEDICARE_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'aetna-mtbank' ]]; then 
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${AETNA_MTBANK_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${AETNA_MTBANK_ORG_ID}\",\"--account_id\",\"${AETNA_MTBANK_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'aahhealthyliving' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${AAHHEALTHYLIVING_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${AAHHEALTHYLIVING_ORG_ID}\",\"--account_id\",\"${AAHHEALTHYLIVING_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'amazon-cigna' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${AMAZON_CIGNA_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${AMAZON_CIGNA_ORG_ID}\",\"--account_id\",\"${AMAZON_CIGNA_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'bannerhealth' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${BANNERHEALTH_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${BANNERHEALTH_ORG_ID}\",\"--account_id\",\"${BANNERHEALTH_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'biomerieux' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${BIOMERIEUX_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${BIOMERIEUX_ORG_ID}\",\"--suborganization_id\",\"${BIOMERIEUX_SUBORG_ID}\",\"--account_id\",\"${BIOMERIEUX_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
# THIS IS THE PART YOU UPDATED MACKENZIE!!!!!!!!!
  elif [[ $CLIENT = 'brmc' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${BRMC_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${BRMC_ORG_ID}\",\"--account_id\",\"${BRMC_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-dev-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
# END UPDATES
 elif [[ $CLIENT = 'caloptima' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${CALOPTIMA_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${CALOPTIMA_ORG_ID}\",\"--account_id\",\"${CALOPTIMA_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'careoregon' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${CAREOREGON_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${CAREOREGON_ORG_ID}\",\"--account_id\",\"${CAREOREGON_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'cchp' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${CCHP_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${CCHP_ORG_ID}\",\"--account_id\",\"${CCHP_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'choc' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${CHOC_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${CHOC_ORG_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'cigna' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${CIGNA_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${CIGNA_ORG_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'countycare' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${COUNTYCARE_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${COUNTYCARE_ORG_ID}\",\"--account_id\",\"${COUNTYCARE_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'elevance' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${ELEVANCE_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${ELEVANCE_ORG_ID}\",\"--account_id\",\"${ELEVANCE_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'elevance-food-benefit' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${ELEVANCE_FOOD_BENEFIT_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${ELEVANCE_FOOD_BENEFIT_ORG_ID}\",\"--account_id\",\"${ELEVANCE_FOOD_BENEFIT_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'elevance-nutrition-education' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${ELEVANCE_NUTRITION_EDUCATION_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${ELEVANCE_NUTRITION_EDUCATION_ORG_ID}\",\"--account_id\",\"${ELEVANCE_NUTRITION_EDUCATION_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'fidelis' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${FIDELIS_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${FIDELIS_ORG_ID}\",\"--account_id\",\"${FIDELIS_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'flblue' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${FLBLUE_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${FLBLUE_ORG_ID}\",\"--account_id\",\"${FLBLUE_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'hscsn' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${HSCSN_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${HSCSN_ORG_ID}\",\"--account_id\",\"${HSCSN_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'ih' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${IH_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${IH_ORG_ID}\"\"--account_id\",\"${IH_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'martinspoint' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${MARTINSPOINT_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${MARTINSPOINT_ORG_ID}\",\"--account_id\",\"${MARTINSPOINT_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'mtbank' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${MTBANK_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${MTBANK_ORG_ID}\",\"--account_id\",\"${MTBANK_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'pacificsource' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${PACIFICSOURCE_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${PACIFICSOURCE_ORG_ID}\",\"--account_id\",\"${PACIFICSOURCE_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'quartz' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${QUARTZ_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${QUARTZ_ORG_ID}\",\"--account_id\",\"${QUARTZ_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'samaritan' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${SAMARITAN_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${SAMARITAN_ORG_ID}\",\"--account_id\",\"${SAMARITAN_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'tog' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${TOG_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${TOG_ORG_ID}\",\"--account_id\",\"${TOG_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'uhcdsnp' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${UHCDSNP_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${UHCDSNP_ORG_ID}\",\"--account_id\",\"${UHCDSNP_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  elif [[ $CLIENT = 'umpqua' ]]; then
    CMD="\"node\",\"./scripts/eligibility/import-eligibility.es6\",${COMMIT}\"--spec\",\"${UMPQUA_SPEC}\",\"--addons\",\"/dev/null\",\"--organization_id\",\"${UMPQUA_ORG_ID}\",\"--account_id\",\"${UMPQUA_ACCOUNT_ID}\",\"--file_date\",\"${EFILE_DATE_MMDDYYYY}\",\"--outputs_path\",\"s3://zipongo-prod-tasks-us-west-2/eligibility/eligibility-import/${CLIENT}_imports_${EFILE_DATE_YYYYMMDD}/\",\"--file\",\"${EFILE_S3_ARN}\""
  else 
    echo "Invalid client: $CLIENT"
    usage
  fi

  echo "Container override command:"
  echo ""
  echo "$CMD"
  echo ""
}

function start_ecs_task()
{
  echo "Starting ECS task for e-file import."
  AWS_PROFILE=dev aws ecs run-task \
    --launch-type FARGATE \
    --cluster App \
    --network-configuration '{"awsvpcConfiguration":{"subnets":["subnet-a6c709ef", "subnet-ef853188"],"securityGroups":["sg-031b2a3ea68991c25"],"assignPublicIp":"DISABLED"}}' \
    --overrides "{\"containerOverrides\":[{ \"name\": \"AppScripts\", \"command\":[ $CMD ]}]}" \
    --task-definition $TASK_DEFINITION_ARN
  STATUS=$?

  if [[ $STATUS -ne 0 ]]; then
    echo "Error starting ECS task."
  fi
}

create_cmd

start_ecs_task

echo $STATUS

exit $STATUS