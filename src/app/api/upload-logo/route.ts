import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Logo upload request received');
    
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);

    // Debug: Log request headers
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Content-Type:', request.headers.get('content-type'));

    // Get the form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing form data:', error);
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    
    const file = formData.get('logo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please select an image file' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'File must be smaller than 5MB' }, { status: 400 });
    }

    // Check if the logos bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('Error checking buckets:', bucketError);
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 500 });
    }
    
    const logosBucket = buckets?.find(bucket => bucket.id === 'logos');
    if (!logosBucket) {
      console.error('Logos bucket not found');
      return NextResponse.json({ error: 'Storage bucket not configured. Please contact support.' }, { status: 500 });
    }

    console.log('Logos bucket found, proceeding with upload');

    // For server-side, we'll upload the file directly without optimization
    // The optimization can be done on the frontend before sending
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}_${uuidv4()}.${fileExtension}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo to storage' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    const logoUrl = publicUrlData.publicUrl;

    // Update user settings with the new logo URL
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        logo: logoUrl,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      // Try to clean up the uploaded file
      await supabase.storage.from('logos').remove([fileName]);
      return NextResponse.json({ error: 'Failed to save logo URL' }, { status: 500 });
    }

    console.log('Logo uploaded successfully:', logoUrl);

    return NextResponse.json({ 
      success: true, 
      logoUrl: logoUrl,
      message: 'Logo uploaded successfully' 
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload logo', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('Logo deletion request received');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);

    // Get current logo URL from database
    const { data: settings, error: fetchError } = await supabase
      .from('user_settings')
      .select('logo, logo_url')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching settings:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current logo' }, { status: 500 });
    }

    // If there's a logo, try to delete it from storage
    if (settings?.logo || settings?.logo_url) {
      const logoUrl = settings.logo || settings.logo_url;
      
      // Extract file path from the logo URL
      const urlParts = logoUrl.split('/');
      const bucketIndex = urlParts.indexOf('logos');
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      if (filePath && filePath.includes('_')) { // Only delete files we uploaded
        const { error: deleteError } = await supabase.storage
          .from('logos')
          .remove([filePath]);
        
        if (deleteError) {
          console.error('Error deleting file from storage:', deleteError);
          // Continue anyway, as the database update is more important
        }
      }
    }

    // Update database to remove logo URLs
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        logo: null,
        logo_url: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
    }

    console.log('Logo removed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Logo removed successfully' 
    });

  } catch (error) {
    console.error('Logo deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove logo', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
