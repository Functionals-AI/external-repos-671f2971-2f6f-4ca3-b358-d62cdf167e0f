import { ECS } from '@aws-sdk/client-ecs'
import { err, ok } from 'neverthrow'
import { succeed, workflow, task } from '@mono/common-flows/lib/builder'

async function refreshInstances (config) {
    return new Promise((resolve, reject) => {
        if (!config.marketing_cdk?.marketing_web_ecs?.cluster_name)
            return reject(`Config is missing necessary value [config.marketing_cdk.marketing_web_ecs.cluster_name]`);
        if (!config.marketing_cdk?.marketing_web_ecs?.service_name)
            return reject(`Config is missing necessary value [config.marketing_cdk.marketing_web_ecs.service_name]`);
        
        const ecs = new ECS({ apiVersion: '2014-11-13' });
        const { cluster_name, service_name } = config.marketing_cdk.marketing_web_ecs;
        const params = {
            cluster: cluster_name,
            service: service_name,
            forceNewDeployment: true,
            deploymentConfiguration: {
                minimumHealthyPercent: 100,
                maximumPercent: 200
            }
        };
        
        ecs.updateService(params, (err, data) => {
            if (err) {
                console.log(`MarketingWebRestart::Error`, err);
                reject(err)
            } else {
                console.log("MarketingWebRestart::Success — Service update initiated:", data);
                resolve(data)
            }
        });
    });
}

export default workflow(function (config) {
    if (!config.marketing_cdk.marketing_web_ecs?.cluster_name) {
        console.log(`Missing config value @marketing_cdk.marketing_web_ecs.cluster_name`);
        return;
    }
    
    if (!config.marketing_cdk.marketing_web_ecs?.service_name) {
        console.log(`Missing config value @marketing_cdk.marketing_web_ecs.service_name`);
        return;
    }
    
    const States = {
        RestartEc2Service: 'RestartEc2Service',
        Success: 'Success',
    }
    
    return {
        startAt: States.RestartEc2Service,
        states: {
            [States.RestartEc2Service]: task({
                handler: async () => {
                    try {
                        const result = await refreshInstances(config);
                        return ok(result);
                    } catch (err) {
                        return err(err)
                    }
                },
                 next: States.Success,
            }),
            [States.Success]: succeed(),
        },
    };
})