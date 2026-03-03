import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '@/lib/postgres';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if user already exists
    const [existing] = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    
    // Use transaction to ensure all inserts succeed or fail together
    await sql.begin(async (sql) => {
      // Insert user
      await sql`
        INSERT INTO users (id, email, password_hash, subscription_plan)
        VALUES (${userId}::uuid, ${email.toLowerCase()}, ${passwordHash}, 'free')
      `;

      // Create profile (matching your existing trigger logic)
      await sql`
        INSERT INTO profiles (id, full_name)
        VALUES (${userId}::uuid, ${fullName || null})
      `;

      // Create default payment methods
      await sql`
        INSERT INTO payment_methods (user_id)
        VALUES (${userId}::uuid)
      `;

      // Create default user settings
      await sql`
        INSERT INTO user_settings (user_id)
        VALUES (${userId}::uuid)
        ON CONFLICT (user_id) DO NOTHING
      `;
    });

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const token = jwt.sign(
      { userId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email: email.toLowerCase(),
        subscription_plan: 'free',
        email_verified: false,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

