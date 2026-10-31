import express from 'express';
import cors from 'cors';
import { createClient } from '@clickhouse/client';

const app = express();
app.use(cors());
app.use(express.json());

const clickhouse = createClient({
  url: 'http://localhost:8123',
  username: 'default',
  password: 'monacosql',
});

// 1. Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await clickhouse.query({ query: 'SELECT 1' });
    const data = await result.json();
    res.json({ status: 'Database connected successfully', data });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error });
  }
});

// 2. Seed database with the example table
app.get('/api/seed', async (req, res) => {
  try {
    await clickhouse.command({ 
      query: 'CREATE TABLE IF NOT EXISTS orders (id UInt32, customer_name String, revenue Float64) ENGINE = MergeTree() ORDER BY id' 
    });
    await clickhouse.command({ 
      query: "INSERT INTO orders VALUES (1, 'Alice', 1200), (2, 'Bob', 850), (3, 'Charlie', 1750), (4, 'Diana', 940)" 
    });
    res.json({ status: 'Database seeded with sample orders table!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database', details: String(error) });
  }
});

// 3. Execute SQL queries from the frontend
app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    const result = await clickhouse.query({ query });
    const data = await result.json();
    // ClickHouse returns the rows inside a 'data' array
    res.json({ rows: data.data });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MonacoSQL API running on http://localhost:${PORT}`);
});