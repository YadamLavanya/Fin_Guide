import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'docs/openapi/openapi.yaml');
    const fileContents = readFileSync(filePath, 'utf8');
    
    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': 'text/yaml',
      },
    });
  } catch (error) {
    console.error('Error reading OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
} 