import { prisma } from './prisma';

export async function getHistoryPeople() {
  const people = await prisma.person.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      stays: {
        orderBy: { sortOrder: 'asc' },
        include: {
          photos: {
            orderBy: { createdAt: 'asc' },
            include: {
              uploadedBy: {
                select: { id: true, displayName: true },
              },
            },
          },
        },
      },
    },
  });

  return people.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    profileImageUrl: p.profileImageUrl,
    isCouple: p.isCouple,
    stays: p.stays.map((s) => ({
      id: s.id,
      placeLabel: s.placeLabel,
      region: s.region,
      lat: s.lat,
      lng: s.lng,
      isCurrent: s.isCurrent,
      sortOrder: s.sortOrder,
      photos: s.photos.map((photo) => ({
        id: photo.id,
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        uploadedByPersonId: photo.uploadedByPersonId,
        uploadedByDisplayName: photo.uploadedBy?.displayName ?? null,
      })),
    })),
  }));
}

export type HistoryPerson = Awaited<ReturnType<typeof getHistoryPeople>>[number];
