import * as pulumi from '@pulumi/pulumi'

import { rabbitmqService } from './src/services/rabbitmq'
import { appLoadBalancer } from './src/load-balancer'
import { ordersService } from './src/services/orders'
import { invoicesService } from './src/services/invoices'
import { kongService } from './src/services/kong'

export const ordersId = ordersService.service.id
export const invoicesId = invoicesService.service.id
export const rabbitMQId = rabbitmqService.service.id
export const kongId = kongService.service.id

export const rabbitMQAdminUrl =  pulumi.interpolate`http://${appLoadBalancer.listeners[0]?.endpoint.hostname}:15672`
export const ordersUrl = pulumi.interpolate`http://${appLoadBalancer.listeners[1]?.endpoint.hostname}:3333`
export const invoicesUrl = pulumi.interpolate`http://${appLoadBalancer.listeners[2]?.endpoint.hostname}:3334`
