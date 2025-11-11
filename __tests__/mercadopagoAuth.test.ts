import { getMercadoPagoAccessToken, getStatementDescriptor, assertMercadoPagoAccessToken } from '@/lib/server/mercadopagoAuth';

describe('mercadopagoAuth helpers', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.MERCADOPAGO_ACCESS_TOKEN;
    delete (process.env as any).MERCADO_PAGO_ACCESS_TOKEN;
    delete (process.env as any).MP_ACCESS_TOKEN;
    delete process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR;
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('getMercadoPagoAccessToken returns null when unset', () => {
    expect(getMercadoPagoAccessToken()).toBeNull();
  });

  test('getMercadoPagoAccessToken reads primary env', () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'token_primary';
    expect(getMercadoPagoAccessToken()).toBe('token_primary');
  });

  test('getMercadoPagoAccessToken reads alias env', () => {
    (process.env as any).MERCADO_PAGO_ACCESS_TOKEN = 'token_alias';
    expect(getMercadoPagoAccessToken()).toBe('token_alias');
  });

  test('assertMercadoPagoAccessToken throws when missing', () => {
    expect(() => assertMercadoPagoAccessToken()).toThrow();
  });

  test('getStatementDescriptor enforces max length 22', () => {
    process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR = '12345678901234567890123XYZ';
    const d = getStatementDescriptor();
    expect(d).toBe('12345678901234567890123'.slice(0, 22));
    expect(d?.length).toBeLessThanOrEqual(22);
  });

  test('getStatementDescriptor returns undefined when blank', () => {
    process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR = '   ';
    expect(getStatementDescriptor()).toBeUndefined();
  });
});

