import * as awsx from "@pulumi/awsx"
import * as pulumi from "@pulumi/pulumi"
import { cluster } from "../cluster"
import { ordersHttpListener } from "./orders"
import { invoicesHttpListener } from "./invoices"
import { appLoadBalancer, networkLoadBalancer } from "../load-balancer"
import { kongDockerImage } from "../images/kong"

const proxyTargetGroup = appLoadBalancer.createTargetGroup('proxy-target-group', {
  port: 8000,
  protocol: 'HTTP',
  healthCheck: {
    path: '/orders/health',
    protocol: 'HTTP',
  }
})

const proxyHttpListener = appLoadBalancer.createListener('proxy-listener', {
  port: 80,
  protocol: 'HTTP',
  targetGroup: proxyTargetGroup,
})

const adminTargetGroup = appLoadBalancer.createTargetGroup('admin-target-group', {
  port: 8002,
  protocol: 'HTTP',
  healthCheck: {
    path: '/',
    protocol: 'HTTP',
  }
})

const adminHttpListener = appLoadBalancer.createListener('admin-listener', {
  port: 8002,
  protocol: 'HTTP',
  targetGroup: adminTargetGroup,
})


const adminApiTargetGroup = appLoadBalancer.createTargetGroup('admin-api-target-group', {
  port: 8001,
  protocol: 'HTTP',
  healthCheck: {
    path: '/',
    protocol: 'HTTP',
  }
})

const adminApiHttpListener = appLoadBalancer.createListener('admin-api-listener', {
  port: 8001,
  protocol: 'HTTP',
  targetGroup: adminApiTargetGroup,
})


export const kongService = new awsx.classic.ecs.FargateService('kong-service', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: kongDockerImage.ref,
      cpu: 256,
      memory: 512,
      environment: [
        {
          name: 'KONG_DATABASE',
          value: 'off',
        },
        {
          name: 'KONG_ADMIN_LISTEN',
          value: '0.0.0.0:8001'
        },
        {
          name: 'ORDERS_SERVICE_URL',
          value: pulumi.interpolate`http://${ordersHttpListener.endpoint.hostname}:${ordersHttpListener.endpoint.port}`,
        },
        {
          name: 'INVOICES_SERVICE_URL',
          value: pulumi.interpolate`http://${invoicesHttpListener.endpoint.hostname}:${invoicesHttpListener.endpoint.port}`,
        }
      ],
      portMappings: [
        proxyHttpListener,
        adminHttpListener,
        adminApiHttpListener
      ]
    }
  }
})


