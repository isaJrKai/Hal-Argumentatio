process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'hal-test-only-jwt-secret-do-not-use-outside-tests-32chars';
process.env.LEAD_ENCRYPTION_KEY_B64 = process.env.LEAD_ENCRYPTION_KEY_B64 || 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=';
