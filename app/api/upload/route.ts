// // Note: This route is used to upload files to an S3 bucket
// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { v4 as uuidv4 } from 'uuid';

// const s3 = new S3Client({
//   region: process.env.AWS_REGION!,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// export async function POST(req: NextRequest) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const formData = await req.formData();
//     const file = formData.get('file') as File;
//     if (!file) {
//       return NextResponse.json({ error: 'No file provided' }, { status: 400 });
//     }

//     const buffer = Buffer.from(await file.arrayBuffer());
//     const key = `avatars/${session.user.id}/${uuidv4()}-${file.name}`;

//     await s3.send(new PutObjectCommand({
//       Bucket: process.env.AWS_BUCKET_NAME!,
//       Key: key,
//       Body: buffer,
//       ContentType: file.type,
//     }));

//     const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
//     return NextResponse.json({ url });
//   } catch (error) {
//     console.error('Upload failed:', error);
//     return NextResponse.json(
//       { error: 'Failed to upload file' },
//       { status: 500 }
//     );
//   }
// }