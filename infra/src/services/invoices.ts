import * as awsx from "@pulumi/awsx"
import * as pulumi from "@pulumi/pulumi"

import { cluster } from "../cluster"
import { invoicesDockerImage } from "../images/invoices"
import { appLoadBalancer } from "../load-balancer"
import { amqpListener } from "./rabbitmq"

const config = new pulumi.Config()

const invoicesHttpTargetGroup = appLoadBalancer.createTargetGroup('invoices-target', {
  port: 3334,
  protocol: 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP',
  }
})

export const invoicesHttpListener = appLoadBalancer.createListener('invoices-listener', {
  port: 3334,
  protocol: 'HTTP',
  targetGroup: invoicesHttpTargetGroup,
})

export const invoicesService = new awsx.classic.ecs.FargateService('invoices-service', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: invoicesDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [
        invoicesHttpListener,
      ],
      environment: [
        {
          name: 'BROKER_URL',
          value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`,
        },
        {
          name: 'DATABASE_URL',
          value: config.require('invoices_database_url'),
        },
        {
          name: 'OTEL_TRACES_EXPORTER',
          value: 'otlp',
        },
        {
          name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
          value: 'https://otlp-gateway-prod-sa-east-1.grafana.net/otlp',
        },
        {
          name: 'OTEL_EXPORTER_OTLP_HEADERS',
          value: 'Authorization=Basic MTA1NTU3MDpnbGNfZXlKdklqb2lNVEl6T0RjeE9TSXNJbTRpT2lKemRHRmpheTB4TURVMU5UY3dMVzkwWld3dGIyNWliMkZ5WkdsdVp5MWxkbVZ1ZEc4dGJtOWtaU0lzSW1zaU9pSTNPRFYxUTFCNWFUZHZPV1ZhYlRReWJUSjZTall3V0VNaUxDSnRJanA3SW5JaU9pSndjbTlrTFhOaExXVmhjM1F0TVNKOWZRPT0=',
        },
        {
          name: 'OTEL_SERVICE_NAME',
          value: 'invoices',
        },
        {
          name: 'OTEL_RESOURCE_ATTRIBUTES',
          value: 'service.name=invoices,service.namespace=evento-node,deployment.environment=production',
        },
        {
          name: 'OTEL_NODE_RESOURCE_DETECTORS',
          value: 'env,host,os',
        },
        {
          name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
          value: 'http,fastify,pg,amqplib',
        }
      ]
    }
  }
})


