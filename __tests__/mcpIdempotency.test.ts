import { checkAndMarkPaymentProcessed } from '@/lib/server/mcpIdempotency';

jest.mock('@/lib/server/firebaseAdmin', () => {
  const setCalls: any[] = [];
  return {
    getFirestoreAdmin: () => ({
      collection: () => ({
        doc: (id: string) => ({
          get: jest.fn(async () => ({ exists: id === 'already' })),
          set: jest.fn(async (payload: any) => { setCalls.push(payload); }),
        }),
      }),
    }),
  };
});

describe('checkAndMarkPaymentProcessed', () => {
  test('returns already_processed when snapshot exists', async () => {
    const res = await checkAndMarkPaymentProcessed('already', { status: 'approved', amount: 100 });
    expect(res).toBe('already_processed');
  });

  test('marks when not exists', async () => {
    const res = await checkAndMarkPaymentProcessed('new', { status: 'approved', amount: 200 });
    expect(res).toBe('marked');
  });
});

