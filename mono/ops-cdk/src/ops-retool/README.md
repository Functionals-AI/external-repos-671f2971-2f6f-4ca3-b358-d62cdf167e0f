Ops-Retool
==========

Gotchas
-------

In `../bin/ops.ts`, Retool specifically is restricted in what environments it will run in. It will need to be modified in order to deploy retool to a new environment.

Additionally, when you create the variable in aws secrests manager for retool, it does not automagically create the database user or database for retool. So we need to run the following SQL in order to bootstrap the database before the installer can run, kick off the database migrations, and stand up the retool application.

```
CREATE USER svc_retool PASSWORD '...';

CREATE DATABASE retool;
ALTER DATABASE retool OWNER TO svc_retool;

GRANT USAGE ON SCHEMA telenutrition TO svc_retool;
GRANT SELECT ON ALL TABLES IN SCHEMA telenutrition TO svc_retool;
GRANT INSERT, UPDATE, DELETE ON TABLE telenutrition.schedule_department_provider TO svc_retool;

```

Additionally, the internal loadbalancer needs to be set in a private route53 entry in production in order for the island connectors to see it properly.

So, if internal-admin.foodsmart-dev.com points to dualstack.internal-opsret-retoo-xxxxxxxxxxxx-1234567890.us-west-2.elb.amazonaws.com., then create a private route53 hosted zone in the production account, bound to the VPC vpc-48cdd92d (production) so that island resolves correctly to the internal ALB instead of the extral one for Okta. 

Debugging Connectivity
----------------------

The network configuration here is pretty complex, so here is step by step how to dig through the mess if something breaks.

### Check fargate to ensure the retool tasks are running

Check to see if the containers are failing to start. If they are, check the logs for shut down tasks. This is most likely an issue of retool trying to reference secrets that weren't placed in AWS Secrets Manager - or being unable to reach the database server(s) it needs to in order to function.

### Island Connector must be online and talking to Island

Island Connectors are EC2 instances in the Ops VPC in each account. You can check them in the Island management console here: https://management.island.io/foodsmart/network/private-access/connectors-v2/connectors

They are configured as per the installation guides available here:

* https://documentation.island.io/docs/deploy-connectors-on-the-company-network-for-ipa
* https://documentation.island.io/docs/deploy-connectors-on-amazon-web-services-aws-for-ipa

They do not need any inbound security group rules to function, but MUST be able to reach out to the systems listed in the [IPA Firewall Whitelist](https://documentation.island.io/docs/island-private-access-ipa-firewall-whitelist).

And if you need to access the machines - the SSH key is kept in Keeper. As a fallback, there is a AWS AppConfig Parameter store entry called `/island-connector/.ssh/authorized_keys` - each island connector is configured with a cronjob to pull that down every 15 minutes, so that you can use the to SSH to the `ziggy` user. 

Additionally, all instances are configured to automatically download and install security patches, but were NOT configured to automatically reboot to apply kernel patches or the like.

### Validate if island can reach the retool load balancer

SSH into the island instance as the `ziggy` user, and run the following command (assuming dev, modify as necessary):

```
curl https://admin.foodsmart-dev.com/api/checkHealth
```

If you see a result like the following, you're done!

```
{"status":"HEALTHY","version":"3.75.11"}
```

If it times out, then we have a few things to check.

### Is Island routing to the right loadbalancer?

In order to make both the island path work, and have a secure path for Okta, there are two load balancers in front of Island. The internet-facing one is extremely restrictive to minimize risk, the internal-facing one is more open to facilitate access. However, to ensure that everyone goes to the right load balancer, there is some DNS trickery.

When you perform the following command (assuming dev) from the terminal on the Island connector, you should get private IPs as a result:

```
dig admin.foodsmart-dev.com
```

```
; <<>> DiG 9.18.28-0ubuntu0.22.04.1-Ubuntu <<>> admin.foodsmart-dev.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 52097
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;admin.foodsmart-dev.com.	IN	A

;; ANSWER SECTION:
admin.foodsmart-dev.com. 60	IN	A	10.10.20.39
admin.foodsmart-dev.com. 60	IN	A	10.10.21.129

;; Query time: 2 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)
;; WHEN: Wed Jan 08 19:23:06 UTC 2025
;; MSG SIZE  rcvd: 84
```

If you get public IPs instead - go to route53 on that account, and ensure that there is a private zone, attached to the Ops VPC for "admin.foodsmart-dev.com", with an alias entry pointing to the internal facing retool load balancer. 

### Ops VPC can talk to <environment> vpc

If it still cannot connect, then there is probably an issue with the VPC peering between the Ops vpc, and the VPC for this environment. 

First thing to check - what VPC and subnets are being used for the internal Load Balancer. In this example for Dev:

* VPC: vpc-7971e21e
* Subnets: subnet-a6c709ef, subnet-ef853188

We also need to check the VPC and subnets for the island connector(s). In this case:

* VPC: vpc-02772a18b4cf3bfbc
* Subnets: subnet-0be6218e893a663fb, subnet-07e06b2c4b1db573b

In the VPC Peering Connections list in the AWS console, there should be a peering configuration between the Ops vpc, and your environment. For dev, we have:

* Name: Ops to dev
* ID: pcx-04c8c1764f92624f7
* Requester VPC: vpc-02772a18b4cf3bfbc / Ops
* Requester CIDRs: 10.7.0.0/16
* Accepter VPC: vpc-7971e21e / dev
* Accepter CIDRs: 10.10.0.0/16

HOWEVER, just because the VPCs are peered, doesn't mean the subnets in the VPC know how to get to each other, so we need to set up the routes. 

So, for each subnet you have, there will be a route table in the VPC > Route Tables list. For each route, you want to create a route for the other side of the peering connection's IP range, pointing to the peering connection.

For this example we will start with the Island connector in us-west-2a, subnet subnet-07e06b2c4b1db573b uses the route table rtb-0968a0c5cb391b804.

So, on the Routes tab for rtb-0968a0c5cb391b804, under Routes you need at LEAST the following two configurations:

* Destination: 10.7.0.0/16
* Target: local

* Destination: 10.10.0.0/16
* Target: pcx-04c8c1764f92624f7

Repeat for all subnets, so that everything has a route pointing to the OTHER VPC in the peering connection.