import { ErrCode } from '../error';
import { IContext } from '../context';
import { err, ok, Result } from 'neverthrow';
import axios from 'axios';
import * as Cio from './destination/cio';
import * as DB from './destination/db';
import { DestinationDefinition } from './service';

const MTAG = ['common', 'segmentation', 'integration'];

export type DestinationConfig = {
    destinationSegmentName?: string;
    destinationSegmentDescription?: string;
    staticColumns?: { name: string; value: any }[];
}

export type IntegrationConfig = {
    segmentId: number;
    destinationDefinition: DestinationDefinition;
    destinationConfig?: DestinationConfig;
};

async function executeServiceOperation(context: IContext, config: IntegrationConfig): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'executeServiceOperation'];
    const { logger } = context;

    try {
        const { name } = config.destinationDefinition.destinationParameters;
        const methodName = name;
        const functionMap: Record<string, Function> = {};

        if (name === 'Cio.syncDataToCio') {
            functionMap[methodName] = Cio.syncDataToCio;
        }

        const functionToCall = functionMap[methodName];

        if (typeof functionToCall === 'function') {
            await functionToCall(context, config);
        } else {
            logger.error(context, tag, `${methodName} is not a function`, { config });

            return err(ErrCode.INVALID_DATA);
        }

        return ok(true);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

async function executeEndpoint(context: IContext, config: IntegrationConfig): Promise<Result<unknown, ErrCode>> {
    const tag = [...MTAG, 'executeEndpoint'];
    const { logger } = context;

    try {
        const { apiUrl, parameters } = config.destinationDefinition.destinationParameters;
        const url = new URL(apiUrl);

        for (const parameter of parameters) {
            if (parameter.required && !parameters[parameter.name]) {
                logger.error(context, tag, 'missing required parameter', { parameter });

                return err(ErrCode.INVALID_DATA);
            }

            url.searchParams.set(parameter.name, parameters[parameter.name]);
        }

        const response = await axios.get(url.toString());

        return ok(response.data);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

async function executeStore(context: IContext, config: IntegrationConfig): Promise<Result<unknown, ErrCode>> {
    const tag = [...MTAG, 'executeDatabase'];
    const { logger } = context;

    try {
        const response = await DB.syncDataToStore(context, config);
        
        return ok(response);
    } catch (e) {
        logger.exception(context, tag, e);
        return err(ErrCode.EXCEPTION);
    }
}

export async function checkAndExecuteOperation(context: IContext, integrationConfig: IntegrationConfig): Promise<Result<boolean, ErrCode>> {
    const tag = [...MTAG, 'executeIntegration'];
    const { logger } = context;

    try {
        const { destinationParameters } = integrationConfig.destinationDefinition;

        switch (destinationParameters.type) {
            case 'endpoint':
                await executeEndpoint(context, integrationConfig);
                break;
            case 'serviceOperation':
                await executeServiceOperation(context, integrationConfig);
                break;
            case 'store':
                await executeStore(context, integrationConfig);
                break;
            default:
                logger.error(context, tag, `Invalid config type '${destinationParameters.type}'`, { integrationConfig });

                return err(ErrCode.INVALID_DATA);
        }

        return ok(true);
    } catch (error) {
        logger.exception(context, tag, error);

        return err(ErrCode.EXCEPTION);
    }
}
