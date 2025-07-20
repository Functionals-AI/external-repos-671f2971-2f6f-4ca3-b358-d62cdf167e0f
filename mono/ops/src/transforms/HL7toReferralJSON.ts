import {ReferralInboundNewRecord} from '@mono/common/lib/referral/service';
import { 
  ReferralGender,
  ReferralRelationshipToMember,
  ReferralService, 
  ReferralStatus, 
  Sources,
} from '@mono/common/lib/referral/store'
import { HL7Message, parserOutput } from './HL7Parser';

// Object for storing HL7 error information
interface errorInfo {
    messageNumber: number,
    errorLocation: string,
    errorMessage: string,
    sourceData: string
}

//add 'existing referral' check to ReferralInboundNewRecord
export interface InboundHL7Referral extends ReferralInboundNewRecord {
    isExistingReferral: boolean|null,
    payerName: string
}

export type returnData = [InboundHL7Referral | {}, errorInfo[]]

/**
 * Converts date string from HL7 message (YYYYMMDDHHmmSS or YYYYMMDD) into a Date
 * 
 * @param fullDate - date from the HL7 message 
 * @returns Date variable
 */
function convertDates(fullDate:string) {
    const year = +fullDate.substring(0,4);
    const month = +fullDate.substring(4,6)-1;
    const date = +fullDate.substring(6,8);

    //extra processing if date includes seconds
    if (fullDate.length === 14) {
        const hour = +fullDate.substring(8,10);
        const min = +fullDate.substring(10,12);
        const sec = +fullDate.substring(12,14);
        let newDate = new Date(year,month,date, hour, min, sec)
        return newDate 
    }
    let newDate = new Date(year,month,date)
    return newDate
}

/**
 * Converts HL7 message Object into a normalized referral Object
 * 
 * @param parserOutput - HL7 message object and original HL7 message as a string
 * @returns an array containing:
 *  1. normalized referral Object OR failure-level errors associated with HL7 message
 *  2. non-failure errors associated with HL7 message
 */
export function normalizeHL7(HL7ParserOutput:parserOutput): returnData {
    const message:HL7Message = HL7ParserOutput['Message Object']
    const parsedMessage:string = `${HL7ParserOutput['Source Data']}`
    
    let errorLog:errorInfo[] = []
    let errorFlag = 0;
    //function to populate errorInfo array
    function errorBuilder(errorLocation:string,errorMessage:string) {

        let sourceData:string
        if (errorLocation.includes("-")) {
            const segment:string = errorLocation.slice(0,3)
            sourceData = message[segment].join('|')
        }
        else {
            sourceData = parsedMessage
        }
        const newErr:errorInfo = {
            messageNumber: +message['MSH'][10],
            errorLocation: errorLocation,
            errorMessage: errorMessage,
            sourceData: `"${sourceData}"`
        };
        errorLog.push(newErr) 
        errorFlag = 1
    } 

    //required elements and error logging
    if (!message['PID'][3]) {
        errorBuilder('PID-3','Missing external patient ID') 
    }
    else if (!message['OBR'][2]) {
        errorBuilder('OBR-2','Missing external order ID') 
    }
    else if (!message['MSH'][7]) {
        errorBuilder('MSH-7','Missing message date/time') 
    }
    else if ((!message['PID'][5][0]) || (!message['PID'][5][1])) {
        errorBuilder('PID-5', 'Missing patient name')
    }
    else if (!message['PID'][7]) {
        errorBuilder('PID-7','Missing patient DOB') 
    }
    else if (!message['PID'][13]) {
        errorBuilder('PID-13','Missing patient phone number/email')   
    }
    else if (!message['PV1'][20]) {
        errorBuilder('PV1','Missing financial class')
    }
    if (errorFlag) {
        console.log('Missing a required field or segment in the message. Skipping.')
        return [{}, errorLog]
    }
    
    //format checks for various fields

    //referral status
    let referralStatus:ReferralStatus;
    let existingReferralCheck:boolean|null = null
    //check for disenrollment flag
    if (message['OBR'][4][1] === 'FOODSMART VCCM DISENROLLMENT') {
        existingReferralCheck = true
        //check for payer change reason
        const disenrollReason:string = message['OBR'][31][1].toString()
        if (disenrollReason.includes('Patient terminates Foodsmart program')) {
            referralStatus = ReferralStatus.COMPLETED;
        }
        else { referralStatus = ReferralStatus.IN_PROGRESS; }
    }
    else { referralStatus = ReferralStatus.REQUESTED; }

    //insurance
    let groupID:string = ''
    let policyID:string = ''
    let relationship:any
    let payerName = 'SELF'
    const insuranceType = message['PV1'][20].toString().toUpperCase()

    //for non self-pay patients
    if ((insuranceType === 'COMM') || (insuranceType === 'GOV')) {
        payerName = message['IN1'][4].toString()
        groupID = message['IN1'][8];
        policyID = message['IN1'][36];
        relationship = message['IN1'][17].toString().toUpperCase();
    }

    // financial class (i.e. gov't vs commercial) and payer (IN1-4)
    // account ID of 0 denotes commercial
    let accountId:number = 0
    if (insuranceType === 'GOV') {
        //CCHP Medicaid for now. Will expand after launch.
        if (payerName.includes('CHORUS COMMUNITY HEALTH PLANS')) {
        accountId = 9 
        }
        // any other govt payers are invalid for now
        else {
            referralStatus = ReferralStatus.INVALID
        }
    }
    else if ((insuranceType === 'COMM') || (insuranceType === 'SELF')) {
        payerName = 'AAH Commercial'
    }
    else {
        errorBuilder('PV1-20', 'Unknown financial class')
    }
    
    //demographics
    let gender = message['PID'][8];
    if (!Object.values(ReferralGender).includes(gender)) {
        gender = '';
        errorBuilder('PID-8','Unrecognized gender') 
    }
    const name =  message['PID'][5];
    const address = message['PID'][11];

    //phone and email info
    const commInfo = message['PID'][13];
    let phoneNum:string = '';
    let email:string = '';

    // if message includes BOTH phone # and email
    if (Array.isArray(commInfo[0])) {
        for (let x = 0; x < commInfo.length; x++) {
            if (commInfo[x][1] === 'P') {
                phoneNum = commInfo[x][0];
            }
            if (commInfo[x][1] === 'NET') {
                email = commInfo[x][3];
            }
        }
    }
    // if message only includes one communication method
    else {
        if (commInfo[1] === 'P') {
            phoneNum = commInfo[0];
            }
        if (commInfo[1] === 'NET') {
            email = commInfo[3];
        }
    }
    
    //diagnoses
    let diagnoses:string[] = [];
    if (message['DG1']) {
        diagnoses.push(message['DG1'][3]);
    }
    
    //dates
    const msgDate = convertDates(message['MSH'][7]);
    const DOB = convertDates(message['PID'][7]);

    // creating the normalized referral JSON
    let normalJSON: InboundHL7Referral = 
        {referralSource: Sources.AAH,
        referralService: ReferralService.HEALTH_ASSESSMENT,
        referralStatus: referralStatus, //OBR-4 (ENROLLMENT vs DISENROLLMENT)
        referralDate: msgDate,
        referralExternalId: message['OBR'][2], //order ID, OBR-2
        referralExternalPatientId: message['PID'][3][0], //Epic patient ID, PID-3.1
        referralFirstName: name[1],
        referralLastName: name[0],
        referralDob: DOB,
        referralLang: message['PID'][15].toString(), 
        referralGender: gender,
        referralPhone: phoneNum,
        referralEmail:  email,
        referralAddress1: address[0],
        referralAddress2: address[1],
        referralCity: address[2],
        referralState: address[3],
        referralZipcode: address[4],
        referralGroupId: groupID,
        referralPolicyId: policyID,
        accountId: accountId,
        referralRelationshipToMember: relationship,
        icd10Codes: diagnoses,
        sourceData: `"${parsedMessage}"`,
        isExistingReferral: existingReferralCheck,
        payerName: payerName
    }

    return [normalJSON, errorLog];
 }