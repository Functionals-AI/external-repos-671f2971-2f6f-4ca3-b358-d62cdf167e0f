/**
 * Summary tables primarily derived from the "enterprise App" (zipongo.com) tables (MySQL).
 * The summaries have dependencies. They are as follows:
 * 
 * Note: <table1> -> <table2> implies <table1> depends on <table2>
 * 
 *  - clean_survey_response (zpipe/pipelines/users/user_data.py)
 *    -> recent_survey_response (zpipe/pipelines/users/user_data.py)
 *      -> foodapp.survey_response (or via fq_foodapp_tenants)
 *  - summary_users_profile (zpipe/pipelines1/summary/summary_users_profile.py)
 *    -> summary_users_bmi (zpipe/pipelines1/summary/summary_users_weightbmi.py)
 *      -> summary_users_conditions (pipelines1/summary/summary-users_conditions.py)
 *        -> See below.
 *  - summary_users_engagement_achieve_weight_loss (pipelines_ms/summary/summary_engagement_weight_loss.py)
 *    -> No dependencies.
 *  - summary_users_conditions (pipelines1/summary/summary-users_conditions.py) *1
 *    -> summary_users_npscomment (pipelines1/summary/summary_users_npscomment.py)
 *      -> See below.
 *  - summary_org_enrollment_count_vw (pipelines1/summary/summary_org_enrollment.py):
 *    -> summary_member_organization (pipelines1/summary/summary_member_organization.py)
 *      -> See below.
 *  - summary_org_enrollment (pipelines1/summary/summary_org_enrollment.py):
 *    -> summary_member_organization:
 *      -> See below.
 *  - summary_users_npscomment (pipelines1/summary/summary_users_npscomment.py) *1
 *    -> summary_nps_response (pipelines1/summary/summary_nps_response.py)
 *      -> summary_nutriscore (pipelines1/summary/summary_nutriscore.py)
 *        -> summary_member_organization (pipelines1/summary/summary_member_organization.py)
 *          -> See below
 *  - summary_member_organization (pipelines1/summary/summary_member_organization.py) *1
 *    -> foodapp.organizations
 *  - biometrics_transform (pipelines1/users/biometrics_transform..py)
 *    -> foodapp.hc_user_biomarkers
 *  - all_user_health (pipelines/users/user_data.py):
 *    -> foodapp.nc_user_biomarkers
 *    -> foodapp.go_users
 *  - zhei_user (anaytics-flows/src/flows/c360-nutriscore.ts)
 *    -> foodapp.hp_ffq_user
 *    -> foodapp.survey_response
 *  - nutriscore_vw (pipelines1/summary/summary_nutriscore.py) *1
 *    -> zhei_user
 *  - summary_nutriscore (pipelines1/summary/summary_nutriscore.py) *1
 *    -> nutriscore_vw
 *  - summary_nutriscore_tags (pipelines1/summary/summary_nutriscore.py)
 *    -> summary_nutriscore
 * 
 * The following ordering can be used:
 * 
 * Note: <table1> -> <table2> here implies <table1> and <table2> execute serially in the specified order (<table1> first, then <table2>).
 * 
 *  - parallel:
 *    - all_user_health (analytics-flows/src/flows/analytics-derived-summaries)
 *    - biometrics_transform
 *    - recent_survey_response (zpipe/pipelines/users/user_data.py)
 *    - summary_member_organizations, 
 *    - summary_users_engagement_achieve_weight_loss
 *    - zhei_user (analytics-flows/src/flows/c360-nutriscore.ts): Requires adjustment where public.* instead is foodapp.*
 *      - parallel: 
 *        - clean_survey_response
 *        - nutriscore_vw -> summary_nutriscore -> summary_nutriscore_tags -> summary_nps_response -> summary_users_npscomment -> summary_users_conditions -> summary_users_bmi -> summary_users_profile
 *        - summary_org_enrollment
 *        - summary_org_enrollment_count_vw
 */
import { parallel, succeed, workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

import { 
  AllUserHealthQuery,
  BiometricsTransformQuery,
  CalculateZheiValuesQuery, 
  CleanedSurveyResponseQuery,
  SummaryEngagementWeightlossQuery,
  SummaryMemberOrganizationQuery,
  SummaryNpsResponseQuery,
  SummaryNutriscoreQuery,
  SummaryOrgEnrollmentQuery,
  SummaryUserConditionsQuery,
  SummaryUsersNpsCommentQuery,
  SummaryUsersProfileQuery,
  SummaryUsersWeightBmiQuery,
} from '../tasks'

enum State {
  ParallelLevel1 = 'ParallelLevel1',
  ParallelLevel2 = 'ParallelLevel2',
  AllUserHealth = 'AllUserHealth',
  BiometricsTransform = 'BiometricsTransform',
  CalculateZheiValues = 'CalculateZheiValues',
  CleanedSurveyResponse = 'CleanedSurveyResponse',
  SummaryEngagementWeightloss = 'SummaryEngagementWeightloss',
  SummaryMemberOrganization = 'SummaryMemberOrganization',
  SummaryNpsResponse = 'SummaryNpsResponse',
  SummaryNutriscore = 'SummaryNutriscore',
  SummaryOrgEnrollment = 'SummaryOrgEnrollment',
  SummaryUserConditions = 'SummaryUserConditions',
  SummaryUsersNpsComment = 'SummaryUsersNpsComment',
  SummaryUsersProfile = 'SummaryUsersProfile',
  SummaryUsersWeightBmi = 'SummaryUsersWeightBmi',
  Success = 'Success'
}

export default workflow(function(config) {
  return {
    event: {
      bus: 'default',
      source: [ 'foodsmart' ],
      detailType: [ 'foodapp.warehouse.sync.completed' ],
    },
    startAt: State.ParallelLevel1,
    states: {
      [State.ParallelLevel1]: parallel({
        branches: [
          {
            startAt: State.AllUserHealth,
            states: {
              [State.AllUserHealth]: AllUserHealthQuery({}),
            },
          },
          {
            startAt: State.BiometricsTransform,
            states: {
              [State.BiometricsTransform]: BiometricsTransformQuery({}),
            },
          },
          {
            startAt: State.SummaryMemberOrganization,
            states: {
              [State.SummaryMemberOrganization]: SummaryMemberOrganizationQuery({}),
            }
          },
          {
            startAt: State.SummaryEngagementWeightloss,
            states: {
              [State.SummaryEngagementWeightloss]: SummaryEngagementWeightlossQuery({}),
            },
          },
          {
            startAt: State.CalculateZheiValues,
            states: {
              [State.CalculateZheiValues]: CalculateZheiValuesQuery({}),
            }
          }
        ],
        next: State.ParallelLevel2,
      }),
      [State.ParallelLevel2]: parallel({
        branches: [
          {
            startAt: State.CleanedSurveyResponse,
            states: {
              [State.CleanedSurveyResponse]: CleanedSurveyResponseQuery({}),
            },
          },
          {
            startAt: State.SummaryNutriscore,
            states: {
              [State.SummaryNutriscore]: SummaryNutriscoreQuery({
                next: State.SummaryNpsResponse
              }),
        	    [State.SummaryNpsResponse]: SummaryNpsResponseQuery({
        	      next: State.SummaryUsersNpsComment,
              }), 
              [State.SummaryUsersNpsComment]: SummaryUsersNpsCommentQuery({
                next: State.SummaryUserConditions
              }),
              [State.SummaryUserConditions]: SummaryUserConditionsQuery({
                next: State.SummaryUsersWeightBmi,
              }),
              [State.SummaryUsersWeightBmi]: SummaryUsersWeightBmiQuery({
                next: State.SummaryUsersProfile,
              }),
              [State.SummaryUsersProfile]: SummaryUsersProfileQuery({})
            }
          },
          {
            startAt: State.SummaryOrgEnrollment,
            states: {
              [State.SummaryOrgEnrollment]: SummaryOrgEnrollmentQuery({}),
            }
          }
        ],
        next: State.Success,
      }),
      [State.Success]: succeed(),
    }
  }
})
