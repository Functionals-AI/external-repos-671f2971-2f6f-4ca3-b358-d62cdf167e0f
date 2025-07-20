import {IContext} from "@mono/common/lib/context";
import * as crypto from 'crypto'

export function generateUserHmacHash(context: IContext, providerId: number): string {

    const { config } = context
    
    const secretKey = config.telenutrition.intercom.hmac_secret_key;

    const intercomHash = crypto.createHmac('sha256', secretKey).update(providerId.toString()).digest('hex');
    
    return intercomHash
}

export default {
    generateUserHmacHash
}
