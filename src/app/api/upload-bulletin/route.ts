import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { prisma } from '@/services/dbService';
import { processBulletin } from '@/services/geminiService';

export const maxDuration = 60; // Allow up to 60 seconds for Gemini PDF parsing

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const sourceOffice = formData.get('sourceOffice') as string || null;
    const bulletinDateStr = formData.get('bulletinDate') as string || null;
    const bulletinDate = bulletinDateStr ? new Date(bulletinDateStr) : null;
    const docType = formData.get('docType') as string || null;
    const commoditiesStr = formData.get('commodities') as string;
    
    let commodities: string[] = [];
    if (commoditiesStr) {
      try { commodities = JSON.parse(commoditiesStr); } catch(e){}
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
    let newBulletin;
    try {
      newBulletin = await prisma.bulletinRecord.create({
        data: {
          fileUrl: publicUrl,
          sourceOffice,
          bulletinDate,
          docType,
          commodities
        },
      });
    } catch (dbError) {
      console.error('Database error during bulletin creation:', dbError);
      
      // ROLLBACK: Remove the orphaned file from Supabase storage
      const { error: removeError } = await supabase.storage
        .from('bulletins')
        .remove([uploadData.path]);
        
      if (removeError) {
        console.error('Failed to cleanup orphaned file in Supabase:', removeError);
      }
      
      return NextResponse.json({ error: 'Database error. Upload rolled back.' }, { status: 500 });
    }

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
