import { Hono } from 'hono';
import { cors } from 'hono/cors';
import bcrypt from 'bcryptjs';

const app = new Hono();

// CORS middleware
app.use('/*', cors({
  origin: '*', // Update this to your Cloudflare Pages URL in production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse JSON
app.use('*', async (c, next) => {
  if (c.req.header('content-type')?.includes('application/json')) {
    c.req.json = await c.req.json();
  }
  await next();
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'Server is running on Cloudflare Workers' });
});

// Login endpoint
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    console.log('Login attempt:', username);

    // Validate input
    if (!username || !password) {
      return c.json({ message: 'Username and password are required.' }, 400);
    }

    // Connect to MongoDB Atlas
    const MONGODB_URI = c.env.MONGODB_URI;
    const JWT_SECRET = c.env.JWT_SECRET;

    if (!MONGODB_URI || !JWT_SECRET) {
      return c.json({ message: 'Server configuration error' }, 500);
    }

    // For now, we'll use a simple hardcoded check
    // TODO: Connect to MongoDB using mongoose or native driver
    
    // Temporary hardcoded admin (replace with DB query)
    const adminUser = {
      username: 'admin',
      // This is the hashed version of 'admin123'
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      role: 'admin',
      _id: '507f1f77bcf86cd799439011'
    };

    if (username !== adminUser.username) {
      return c.json({ message: 'Invalid credentials.' }, 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
    
    if (!isMatch) {
      return c.json({ message: 'Invalid credentials.' }, 401);
    }

    // Generate simple token (use JWT library for production)
    const token = `${adminUser._id}.${Date.now()}.${JWT_SECRET.substring(0, 10)}`;

    return c.json({
      token,
      user: {
        id: adminUser._id,
        username: adminUser.username,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ message: 'Server error', error: error.message }, 500);
  }
});

// Get all products (placeholder)
app.get('/api/products', async (c) => {
  // TODO: Fetch from MongoDB
  return c.json([
    {
      _id: '1',
      name: 'Sample Product 1',
      description: 'This is a sample product',
      price: 99.99,
      category: 'Electronics',
      stock: 50
    },
    {
      _id: '2',
      name: 'Sample Product 2',
      description: 'Another sample product',
      price: 149.99,
      category: 'Furniture',
      stock: 30
    }
  ]);
});

// Export the app
export default app;
