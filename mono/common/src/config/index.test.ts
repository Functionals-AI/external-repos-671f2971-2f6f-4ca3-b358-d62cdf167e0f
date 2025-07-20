import { ok } from 'neverthrow';
import Config, { Environment, IConfig } from './'
import Devenv from './devenv';

describe("from", () => {
  it('returns the config by env name.', async () => {
    const expected = { env: 'devenv' } as IConfig
    jest.spyOn(Devenv, 'fetch').mockResolvedValueOnce(ok(expected))
    const received = await Config.from('devenv');
    expect(received).toBe(expected)
  });

  it('throws an error for an invalid env name.', async () => {
    const promise = Config.from('fake-env' as Environment)
    expect(promise).rejects.toThrowError()
  });
});
