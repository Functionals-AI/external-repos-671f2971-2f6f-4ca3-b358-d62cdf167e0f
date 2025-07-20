/**
 * Transforms an HL7 message into an HL7-like object where:
 * 1. each key corresponds to an HL7 segment name
 * 2. each value is an array with the segment's data
 * 
 * Also outputs the original HL7 message as a string for recordkeeping/debugging
 * 
 */
export interface HL7Message {
  [segmentName:string]: any[]; 
}
export interface parserOutput {
  'Message Object': HL7Message,
  'Source Data': string

}

/**
 * Splits fields in an HL7 message based on repetitions or sub-fields
 * 
 * @param rawSegment - HL7 segment that's already been split by pipes. Example format: ['PID', '1', '', ...]
 * @param start - starting index for segment processing. MSH segments should have a later start index. 
 * @returns transformed segment; array of strings and arrays.
 */
function splitHL7Fields(rawSegment:any[], start: number) {
  let finalSegment = rawSegment;

  for (let i = start; i < rawSegment.length; i++) {

    // check for repetitions (~)
    if (rawSegment[i].includes('~')) {
      finalSegment[i] = rawSegment[i].split('~');
      let intSegment: string[][] = [];
      
      // split into sub-components (^)
      for (let k = start; k < finalSegment[i].length; k++) {
        if (finalSegment[i][k].includes('^')) {
          intSegment.push(finalSegment[i][k].split('^'));
          finalSegment[i] = intSegment; }
      }
    }

    // still need to split into sub-components (^) if there aren't repetitions
    else {
      if (rawSegment[i].includes('^')) {
        finalSegment[i] = rawSegment[i].toString().split('^'); }
    }
  }
return finalSegment;
}

/**
 * String manipulation function - HL7 string into a HL7-like object
 * 
 * @param msgString - HL7 message as a string 
 * @returns object containing HL7-like object and original message
 */
export function HL7Transform(msgString: string): parserOutput {
  
  //split each message into individual segments
  let splitMessage: string[] = msgString.split('\r');
  let messageObject: HL7Message = {};
  
  // looping over each segment in the parsed message and adding it to the Message object
  for (var segment of splitMessage) {
    //split segment into fields first
    let unparsedSegment: string[] = segment.split('|');
    let HL7Segment:any[];

    // different rules for MSH segments
    if (unparsedSegment[0] === 'MSH' ) {
      HL7Segment = splitHL7Fields(unparsedSegment,2); 
      HL7Segment.splice(1,0,'|'); // add first pipe back since MSH-1 is always |
    }
    else {
      HL7Segment = splitHL7Fields(unparsedSegment,0); }

    let header = HL7Segment[0].toString();
    messageObject = {...messageObject, [header]: HL7Segment};
  }
  
  //output containing HL7 JSON object and original, unparsed message
  const parsedMessage:parserOutput = {
    'Message Object': messageObject,
    'Source Data': msgString
  }
  return parsedMessage
}