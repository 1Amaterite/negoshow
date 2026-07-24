import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { prisma } from '@/services/dbService';
import { processBulletin } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    // Basic auth check
    const authHeader = request.headers.get('Authorization');
    if (!process.env.ADMIN_API_TOKEN || authHeader !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bulletins')
      .upload(uniqueFileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload to storage: ' + uploadError.message }, { status: 500 });
    }

    // Get the public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('bulletins')
      .getPublicUrl(uploadData.path);

    // Save record to Prisma database
    const newBulletin = await prisma.bulletinRecord.create({
      data: {
        fileUrl: publicUrl,
        // The processedStatus will default to 'PENDING'
        // The uploadDate will default to now()
      },
    });

    // Fire off the AI processing
    try {
      await processBulletin(newBulletin.id, publicUrl);
    } catch (processError) {
      console.error('Gemini processing failed:', processError);
      
      await prisma.bulletinRecord.update({
        where: { id: newBulletin.id },
        data: { processedStatus: 'REQUIRES_MANUAL_REVIEW' }
      });
      
      return NextResponse.json({ 
        message: 'File uploaded, but AI extraction failed. Requires manual review.', 
        data: newBulletin 
      }, { status: 202 });
    }

    return NextResponse.json({ 
      message: 'File uploaded and processed successfully', 
      data: newBulletin 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in upload-bulletin route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
