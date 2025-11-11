import { POST } from '@/app/api/mercadopago/process-payment/route';

describe('process-payment endpoint', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, MERCADOPAGO_ACCESS_TOKEN: 'test_token' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('returns 400 on invalid input', async () => {
    // Minimal fake request with invalid paymentId
    const req: any = { json: async () => ({ paymentId: 'abc' }), headers: new Headers() };
    const res: any = await POST(req);
    expect(res.status).toBe(400);
  });

  test('calls MCP payments API and returns 200 on success', async () => {
    const mockFetch = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 100,
        currency_id: 'ARS',
        payment_method_id: 'visa',
        date_approved: new Date().toISOString(),
        id: 123,
        external_reference: 'ref',
        payer: { email: 'a@b.com', identification: { type: 'DNI', number: '123' } },
        metadata: {},
      }),
    } as any);

    const req: any = { json: async () => ({ paymentId: '123' }), headers: new Headers() };
    const res: any = await POST(req);
    expect(mockFetch).toHaveBeenCalled();
    expect(res.status).toBe(200);
    mockFetch.mockRestore();
  });
});

