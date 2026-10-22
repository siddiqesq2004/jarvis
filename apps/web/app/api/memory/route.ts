import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/db/store';

export async function GET() {
  return NextResponse.json({
    memories: dataStore.memories
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category = 'preference', content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Memory content cannot be empty.' }, { status: 400 });
    }

    const newMem = {
      id: `mem-${Date.now()}`,
      category,
      content,
      confidence: 1.0,
      is_approved: true
    };

    dataStore.memories.push(newMem);
    return NextResponse.json({ status: 'created', memory: newMem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Memory ID is required.' }, { status: 400 });
  }

  dataStore.memories = dataStore.memories.filter(m => m.id !== id);
  return NextResponse.json({ status: 'deleted', id });
}
