import { AuthService } from './services/auth.js';
import { AuthConfig } from './types.js';

async function runVerification() {
  console.log('Starting Security Verification...');

  const config: AuthConfig = {
    userByteLength: 6,
    passByteLength: 8,
    persistentCredentials: false,
  };

  const authService = new AuthService(config);
  const credentials = authService.getCredentials();
  const validToken = credentials.basicToken;
  const invalidToken = Buffer.from('wrong:password').toString('base64');
  const differentLengthToken = Buffer.from('u:p').toString('base64');

  console.log('\n--- Testing Authentication ---');

  // Test valid token
  const authValid = authService.authenticate({
    'proxy-authorization': `Basic ${validToken}`,
  });
  console.log(`Valid Token Auth: ${authValid ? '✅ PASSED' : '❌ FAILED'}`);

  // Test invalid token (same length)
  const fakeValidToken = Buffer.alloc(Buffer.from(validToken).length, 'a').toString('base64');
  const authInvalid = authService.authenticate({
    'proxy-authorization': `Basic ${fakeValidToken}`,
  });
  console.log(`Invalid Token (same length) Auth: ${!authInvalid ? '✅ PASSED' : '❌ FAILED'}`);

  // Test different length token
  const authDiffLength = authService.authenticate({
    'proxy-authorization': `Basic ${differentLengthToken}`,
  });
  console.log(`Invalid Token (diff length) Auth: ${!authDiffLength ? '✅ PASSED' : '❌ FAILED'}`);

  // Test missing header
  const authMissing = authService.authenticate({});
  console.log(`Missing Header Auth: ${!authMissing ? '✅ PASSED' : '❌ FAILED'}`);

  if (authValid && !authInvalid && !authDiffLength && !authMissing) {
    console.log('\n✅ All security checks passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some security checks failed!');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
