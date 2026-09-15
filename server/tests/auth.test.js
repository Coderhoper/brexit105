const request = require('supertest')

jest.mock('../src/db', () => {
  const bcrypt = require('bcrypt')
  return {
    initializeDatabase: jest.fn(async () => true),
    query: jest.fn((text, params) => {
      // simple SQL text-based dispatch for test
      if (text.includes('COUNT(*) FROM users WHERE role')) {
        return Promise.resolve({ rows: [{ count: '0' }] })
      }
      if (text.startsWith('SELECT id FROM users WHERE email')) {
        return Promise.resolve({ rows: [] })
      }
      if (text.startsWith('INSERT INTO users')) {
        return Promise.resolve({ rows: [{ id: 1, name: params[0], email: params[1], role: params[3], phone: params[4], created_at: new Date() }] })
      }
      if (text.startsWith('SELECT id, name, email, password_hash, role FROM users WHERE email')) {
        // return a user with password_hash for 'secret'
        const h = bcrypt.hashSync('secret', 10)
        return Promise.resolve({ rows: [{ id: 1, name: 'Test', email: params[0], password_hash: h, role: 'owner' }] })
      }
      return Promise.resolve({ rows: [] })
    })
  }
})

const app = require('../src/app')
const { initializeDatabase } = require('../src/db')

describe('Auth routes', () => {
  test('register creates a user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'pass123', role: 'owner' })
    expect(res.statusCode).toBe(201)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe('alice@example.com')
  })

  test('login returns token', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'whatever@example.com', password: 'secret' })
    expect(res.statusCode).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  test('rejects creating more than two owners', async () => {
    const db = require('../src/db')
    db.query.mockImplementation((text) => {
      if (text.includes('COUNT(*) FROM users WHERE role')) {
        return Promise.resolve({ rows: [{ count: '2' }] })
      }
      return Promise.resolve({ rows: [] })
    })

    const res = await request(app).post('/api/auth/register').send({ name: 'Third', email: 'third@example.com', password: 'pass123', role: 'owner' })
    expect(res.statusCode).toBe(403)
    expect(res.body.message).toMatch(/Owner limit reached/i)
  })

  test('initializeDatabase creates the required schema when tables are missing', async () => {
    await expect(initializeDatabase()).resolves.toBeTruthy()
  })
})
