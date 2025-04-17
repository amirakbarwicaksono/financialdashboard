import bcrypt from 'bcryptjs'; // Switched to bcryptjs for pure JavaScript implementation
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

// Initialize PostgreSQL client
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Helper function to create tables
async function createTableIfNotExists(tableName: string, schema: string) {
  await sql`CREATE TABLE IF NOT EXISTS ${sql(tableName)} (${sql(schema)})`;
}

// Seed Users Table
async function seedUsers() {
  // Create Users Table
  await createTableIfNotExists('users', `
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  `);

  // Insert Users with hashed passwords
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10); // Use bcryptjs for hashing
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

// Seed Customers Table
async function seedCustomers() {
  // Create Customers Table
  await createTableIfNotExists('customers', `
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL
  `);

  // Insert Customers
  const insertedCustomers = await Promise.all(
    customers.map((customer) => sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING;
    `),
  );

  return insertedCustomers;
}

// Seed Invoices Table
async function seedInvoices() {
  // Create Invoices Table
  await createTableIfNotExists('invoices', `
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(255) NOT NULL,
    date DATE NOT NULL
  `);

  // Insert Invoices
  const insertedInvoices = await Promise.all(
    invoices.map((invoice) => sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (id) DO NOTHING;
    `),
  );

  return insertedInvoices;
}

// Seed Revenue Table
async function seedRevenue() {
  // Create Revenue Table
  await createTableIfNotExists('revenue', `
    month VARCHAR(4) NOT NULL UNIQUE,
    revenue INT NOT NULL
  `);

  // Insert Revenue Data
  const insertedRevenue = await Promise.all(
    revenue.map((rev) => sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING;
    `),
  );

  return insertedRevenue;
}

// Main GET Route
export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is missing');
    }

    // Create UUID extension if not exists
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Begin transaction and seed database
    const result = await sql.begin(async (sql) => {
      await seedUsers();
      await seedCustomers();
      await seedInvoices();
      await seedRevenue();
    });

    return Response.json({ message: 'Database seeded successfully', result });
  } catch (error) {
    console.error('Error seeding database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}