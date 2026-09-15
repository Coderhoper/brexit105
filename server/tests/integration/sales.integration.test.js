const request = require('supertest')
const fs = require('fs')
const path = require('path')

// Mock `server/src/db` with an internal pg-mem database so tests run without Docker.
jest.mock('../../../server/src/db', () => {
  const { newDb } = require('pg-mem')
  const mem = newDb()
  const pg = mem.adapters.createPg()
  const Pool = pg.Pool
  const pool = new Pool()
  return {
    query: (text, params) => pool.query(text, params),
    pool
  }
})

const db = require('../../../server/src/db')
const app = require('../../../server/src/app')

async function runMigrations() {
  const sql = fs.readFileSync(path.resolve(__dirname, '../../../migrations/001_init.sql'), 'utf8')
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length)
  for (const st of statements) {
    await db.query(st)
  }
}

describe('Integration: Sales workflow', () => {
  beforeAll(async () => {
    // ensure migrations applied
    await runMigrations()
  })

  afterAll(async () => {
    // close pool
    await db.pool.end()
  })

  test('create owner, create product, record sale and deduct stock', async () => {
    // register owner
    const reg = await request(app).post('/api/auth/register').send({ name: 'Owner', email: 'owner@local', password: 'pass', role: 'owner' })
    expect(reg.statusCode).toBe(201)

    // login
    const login = await request(app).post('/api/auth/login').send({ email: 'owner@local', password: 'pass' })
    expect(login.statusCode).toBe(200)
    const token = login.body.token
    expect(token).toBeDefined()

    // create product
    const prod = await request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send({ product_name: 'Widget', sku: 'W1', unit_cost_price: 2.5, unit_selling_price: 5, current_stock_quantity: 10 })
    expect(prod.statusCode).toBe(201)
    const product = prod.body.product
    expect(product.current_stock_quantity).toBe(10)

    // create sale of 3 units
    const sale = await request(app).post('/api/sales').set('Authorization', `Bearer ${token}`).send({ items: [{ product_id: product.id, quantity: 3, unit_price: 5 }], payment_method: 'cash' })
    expect(sale.statusCode).toBe(201)

    // fetch product and verify stock is 7
    const fetched = await request(app).get(`/api/products/${product.id}`).set('Authorization', `Bearer ${token}`)
    expect(fetched.statusCode).toBe(200)
    expect(fetched.body.product.current_stock_quantity).toBe(7)
  }, 20000)

  test('staff user can view products and create sales but cannot manage products', async () => {
    const ownerReg = await request(app).post('/api/auth/register').send({ name: 'Owner2', email: 'owner2@local', password: 'pass', role: 'owner' })
    expect(ownerReg.statusCode).toBe(201)

    const ownerLogin = await request(app).post('/api/auth/login').send({ email: 'owner2@local', password: 'pass' })
    expect(ownerLogin.statusCode).toBe(200)
    const ownerToken = ownerLogin.body.token

    const product = await request(app).post('/api/products').set('Authorization', `Bearer ${ownerToken}`).send({ product_name: 'Staff Sale Item', sku: 'S1', unit_cost_price: 2, unit_selling_price: 6, current_stock_quantity: 8 })
    expect(product.statusCode).toBe(201)

    const staffReg = await request(app).post('/api/auth/register').send({ name: 'Cashier', email: 'cashier@local', password: 'pass', role: 'staff' })
    expect(staffReg.statusCode).toBe(201)

    const staffLogin = await request(app).post('/api/auth/login').send({ email: 'cashier@local', password: 'pass' })
    expect(staffLogin.statusCode).toBe(200)
    const staffToken = staffLogin.body.token

    const list = await request(app).get('/api/products').set('Authorization', `Bearer ${staffToken}`)
    expect(list.statusCode).toBe(200)

    const sale = await request(app).post('/api/sales').set('Authorization', `Bearer ${staffToken}`).send({ items: [{ product_id: product.body.product.id, quantity: 2, unit_price: 6 }], payment_method: 'cash' })
    expect(sale.statusCode).toBe(201)

    const blocked = await request(app).post('/api/products').set('Authorization', `Bearer ${staffToken}`).send({ product_name: 'Blocked', sku: 'B1', unit_cost_price: 1, unit_selling_price: 2, current_stock_quantity: 3 })
    expect(blocked.statusCode).toBe(403)
  }, 20000)
})
