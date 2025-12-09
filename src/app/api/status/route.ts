import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime?: number;
}

export async function GET() {
  const startTime = Date.now();
  const services: ServiceStatus[] = [];

  try {
    // Check Supabase Database
    try {
      const dbStartTime = Date.now();
      const { error } = await supabaseAdmin
        .from('user_settings')
        .select('id')
        .limit(1);
      
      const dbResponseTime = Date.now() - dbStartTime;
      
      if (error) {
        services.push({
          name: 'Database',
          status: 'down',
          responseTime: dbResponseTime
        });
      } else {
        services.push({
          name: 'Database',
          status: dbResponseTime > 1000 ? 'degraded' : 'operational',
          responseTime: dbResponseTime
        });
      }
    } catch (error) {
      services.push({
        name: 'Database',
        status: 'down'
      });
    }

    // Check Email Service (Resend)
    try {
      const emailStartTime = Date.now();
      if (!process.env.RESEND_API_KEY) {
        services.push({
          name: 'Email Service',
          status: 'down'
        });
      } else {
        // Simple check - if API key exists, assume operational
        const emailResponseTime = Date.now() - emailStartTime;
        services.push({
          name: 'Email Service',
          status: 'operational',
          responseTime: emailResponseTime
        });
      }
    } catch (error) {
      services.push({
        name: 'Email Service',
        status: 'down'
      });
    }

    // Check API
    const apiResponseTime = Date.now() - startTime;
    services.push({
      name: 'API',
      status: apiResponseTime > 500 ? 'degraded' : 'operational',
      responseTime: apiResponseTime
    });

    // Determine overall status
    const hasDown = services.some(s => s.status === 'down');
    const hasDegraded = services.some(s => s.status === 'degraded');
    
    const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'operational';

    return NextResponse.json({
      status: overallStatus,
      services,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'down',
      services: [],
      timestamp: new Date().toISOString(),
      error: 'Unable to check system status'
    }, { status: 500 });
  }
}

