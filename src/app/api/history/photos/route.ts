import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionPersonId } from '@/lib/session';
import { hasInvitation } from '@/lib/history';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: Request) {
  const personId = await getSessionPersonId();
  if (!personId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await hasInvitation(personId, 'wedding'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await request.formData();
  const placeLabel = String(form.get('placeLabel') ?? '').trim();
  const captionRaw = form.get('caption');
  const caption =
    typeof captionRaw === 'string' && captionRaw.trim()
      ? captionRaw.trim().slice(0, 200)
      : null;
  const file = form.get('file');

  if (!placeLabel) {
    return NextResponse.json({ error: 'Missing place' }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Image must be under 5MB' },
      { status: 400 },
    );
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json(
      { error: 'Use a JPEG, PNG, or WebP image' },
      { status: 400 },
    );
  }

  // Guests may only attach media to places in their own timeline
  const stay = await prisma.locationStay.findFirst({
    where: { personId, placeLabel },
    orderBy: { sortOrder: 'asc' },
  });
  if (!stay) {
    return NextResponse.json(
      { error: 'You can only add photos to places you’ve lived' },
      { status: 403 },
    );
  }

  const photoId = randomUUID();
  const relDir = path.join('uploads', 'history', personId);
  const absDir = path.join(process.cwd(), 'public', relDir);
  await mkdir(absDir, { recursive: true });

  const filename = `${photoId}.${ext}`;
  const absPath = path.join(absDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, bytes);

  const imageUrl = `/${relDir}/${filename}`.replace(/\\/g, '/');

  const photo = await prisma.locationPhoto.create({
    data: {
      id: photoId,
      locationStayId: stay.id,
      uploadedByPersonId: personId,
      imageUrl,
      caption,
    },
    include: {
      uploadedBy: { select: { id: true, displayName: true } },
    },
  });

  return NextResponse.json({
    photo: {
      id: photo.id,
      imageUrl: photo.imageUrl,
      caption: photo.caption,
      uploadedByPersonId: photo.uploadedByPersonId,
      uploadedByDisplayName: photo.uploadedBy?.displayName ?? null,
    },
  });
}
