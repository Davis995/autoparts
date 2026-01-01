import { NextRequest, NextResponse } from 'next/server';

// Cart has been moved entirely to localStorage on the client.
// These endpoints are kept only to avoid 404s if something still calls them.

export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart is managed locally in the browser; no server cart.' },
    { status: 410 }
  );
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart is managed locally in the browser; no server cart.' },
    { status: 410 }
  );
}
