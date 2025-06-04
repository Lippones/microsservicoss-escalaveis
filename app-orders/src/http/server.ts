import '@opentelemetry/auto-instrumentations-node/register'

import { trace } from '@opentelemetry/api'

import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'
import { z } from 'zod'

import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { randomUUID } from 'node:crypto'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { setTimeout } from 'node:timers/promises'
import { tracer } from '../tracer/tracer.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: '*'
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.get('/health', async () => {
  return 'OK'
})

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.coerce.number().int().positive(),
    })
  },
}, async (req, reply) => {
  const { amount } = req.body

  console.log(`[Orders] Received order with amount: ${amount}`)

  const orderId = randomUUID()

  dispatchOrderCreated({
    orderId,
    amount,
    customer: {
      id: '0104fce3-28ad-440b-b6b8-1e1c34978b58'
    }
  })

  await db.insert(schema.orders).values({
    id: orderId,
    customerId: '0104fce3-28ad-440b-b6b8-1e1c34978b58',
    amount
  })

  trace.getActiveSpan()?.setAttribute('order.id', orderId)

  return reply.status(201).send()
})

app.listen({ port: 3333, host: '0.0.0.0'}).then(() => {
  console.log('🧨 [Orders] HTTP Server running')
})