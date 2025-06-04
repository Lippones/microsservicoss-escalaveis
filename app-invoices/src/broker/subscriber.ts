import { orders } from "./channels/orders.ts"

orders.consume('orders', async (message) => {
  if(!message) {
    console.error('[Invoices] Received null message')
    return null
  }
  
  console.log(`[Invoices] Received order created message: ${message.content.toString()}`)

  orders.ack(message)
}, {
  noAck: false,
})