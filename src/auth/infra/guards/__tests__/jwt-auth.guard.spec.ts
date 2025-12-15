import { JwtAuthGuard } from '../jwt-auth';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should have canActivate method', () => {
    // Note: This test requires actual JWT validation which happens in the strategy
    // For unit testing, we're just verifying the guard exists and can be instantiated
    expect(guard.canActivate).toBeDefined();
  });
});
