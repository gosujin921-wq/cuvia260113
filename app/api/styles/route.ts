import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STYLES_FILE_PATH = path.join(process.cwd(), 'components', 'shared', 'styles.ts');

// GET: 현재 스타일 읽기
export async function GET() {
  try {
    const fileContent = fs.readFileSync(STYLES_FILE_PATH, 'utf-8');
    return NextResponse.json({ success: true, content: fileContent });
  } catch (error) {
    console.error('Error reading styles file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read styles file' },
      { status: 500 }
    );
  }
}

// POST: 스타일 업데이트
export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // 파일 쓰기
    fs.writeFileSync(STYLES_FILE_PATH, content, 'utf-8');
    
    return NextResponse.json({ success: true, message: 'Styles updated successfully' });
  } catch (error) {
    console.error('Error writing styles file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to write styles file' },
      { status: 500 }
    );
  }
}

