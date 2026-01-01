import { NextRequest, NextResponse } from 'next/server';

// Cart is handled entirely on the client via localStorage.
// These endpoints are deprecated and no longer touch the database.

export async function PUT(_request: NextRequest, _context: { params: Promise<{ id: string }> }) {
  return NextResponse.json(
    { error: 'Server cart disabled; quantities are updated locally.' },
    { status: 410 }
  );
}

export async function DELETE(_request: NextRequest, _context: { params: Promise<{ id: string }> }) {
  return NextResponse.json(
    { error: 'Server cart disabled; removals are handled locally.' },
    { status: 410 }
  );
}
