# Ripply Backend Test Suite

Comprehensive unit and integration tests for the Ripply backend API to ensure safe refactoring of monolithic code.

## 🎯 Purpose

This test suite was created to:
- **Validate existing functionality** before refactoring the massive monoliths
- **Ensure no breaking changes** during the refactoring process  
- **Provide regression testing** for critical business logic
- **Document expected behavior** of all API endpoints

## 📊 Coverage Overview

### Test Categories

| Category | File | Coverage | Description |
|----------|------|----------|-------------|
| **Authentication** | `routes/auth.test.js` | 95%+ | Registration, login, token verification |
| **Users** | `routes/users.test.js` | 90%+ | Profile management, follow/unfollow, search |
| **Voice Notes** | `routes/voiceNotes.test.js` | 85%+ | CRUD, feed algorithm, likes, comments |
| **Voice Bios** | `routes/voiceBios.test.js` | 90%+ | Bio creation, updates, retrieval |
| **Auth Middleware** | `middleware/auth.test.js` | 95%+ | JWT validation, permissions |
| **Account Lockout** | `middleware/accountLockout.test.js` | 90%+ | Rate limiting, security |

### Critical Monoliths Covered

✅ **`src/routes/voiceNotes.js` (1,938 lines)** - The largest monolith  
✅ **`src/routes/users.js` (671 lines)** - User management monolith  
✅ **`src/routes/auth.js` (487 lines)** - Authentication monolith  
✅ **All middleware components**  
✅ **Database interaction patterns**  

## 🚀 Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/routes/auth.test.js
```

### Advanced Usage
```bash
# Run custom test runner with detailed reporting
node tests/runTests.js

# Run specific category
node tests/runTests.js "Voice Notes"

# Watch mode for development
npm run test:watch

# Verbose output
npm run test:verbose
```

## 📁 Test Structure

```
tests/
├── helpers/
│   ├── testDatabase.js      # Database utilities for tests
│   ├── testEnv.js          # Environment setup
│   ├── globalSetup.js      # Global test setup
│   └── globalTeardown.js   # Global test cleanup
├── routes/
│   ├── auth.test.js        # Authentication endpoints
│   ├── users.test.js       # User management endpoints  
│   ├── voiceNotes.test.js  # Voice notes endpoints (largest)
│   └── voiceBios.test.js   # Voice bios endpoints
├── middleware/
│   ├── auth.test.js        # JWT authentication
│   └── accountLockout.test.js # Rate limiting
├── runTests.js             # Custom test runner
└── README.md              # This file
```

## 🧪 Test Patterns

### Database Testing
```javascript
const { TestDatabase } = require('../helpers/testDatabase');

describe('API Tests', () => {
  let testDb;

  beforeEach(() => {
    testDb = new TestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup(); // Automatic cleanup
  });

  it('should create test data', async () => {
    const user = await testDb.createTestUser();
    const voiceNote = await testDb.createTestVoiceNote(user.id);
    // Test with real data
  });
});
```

### Authentication Testing
```javascript
// Mock authenticated requests
mockAuth.authenticateToken.mockImplementation((req, res, next) => {
  req.user = mockUser;
  next();
});

const response = await request(app)
  .post('/voice-notes')
  .set('Authorization', `Bearer ${authToken}`)
  .send(voiceNoteData)
  .expect(201);
```

### Error Handling Testing
```javascript
// Test database errors
mockSupabase.from.mockReturnValue({
  select: jest.fn().mockRejectedValue(new Error('Database error'))
});

const response = await request(app)
  .get('/users/123')
  .expect(500);

expect(response.body).toHaveProperty('message', 'Server error');
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: Node.js
- **Timeout**: 30 seconds (for database operations)
- **Coverage Threshold**: 70% minimum
- **Setup**: Automatic test database management

### Environment Variables (`.env.test`)
```bash
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
SUPABASE_URL=your-test-supabase-url
SUPABASE_KEY=your-test-supabase-key
```

## 🎯 Test Strategy

### Before Refactoring
1. **Run full test suite**: `npm run test:coverage`
2. **Verify 70%+ coverage** on all critical paths
3. **Document any failing tests** as known issues
4. **Baseline the results** for comparison

### During Refactoring
1. **Run tests after each change**: `npm test`
2. **Monitor coverage changes**: Coverage should not decrease
3. **Fix tests immediately** if functionality changes
4. **Add new tests** for new modules created

### After Refactoring
1. **Verify all tests still pass**
2. **Update tests** to reflect new module structure
3. **Add integration tests** for new service boundaries
4. **Maintain or improve coverage**

## 🚨 Critical Test Cases

### Authentication Flow
- ✅ User registration with validation
- ✅ Login with email/password
- ✅ JWT token verification
- ✅ Account lockout after failed attempts
- ✅ Social authentication callbacks

### Voice Notes (Largest Monolith)
- ✅ CRUD operations
- ✅ Feed algorithm (balanced/latest)
- ✅ Search functionality
- ✅ Like/unlike operations
- ✅ Comment system
- ✅ Share/repost functionality
- ✅ Tag management
- ✅ Play tracking

### User Management
- ✅ Profile operations
- ✅ Follow/unfollow system
- ✅ User search and discovery
- ✅ Follower/following counts
- ✅ Permission checks

### Security & Middleware
- ✅ JWT token validation
- ✅ Rate limiting mechanisms
- ✅ Account lockout thresholds
- ✅ Input validation
- ✅ Error handling

## 📈 Coverage Requirements

| Metric | Minimum | Target | Current |
|--------|---------|--------|---------|
| **Lines** | 70% | 85% | TBD |
| **Functions** | 70% | 90% | TBD |
| **Branches** | 70% | 80% | TBD |
| **Statements** | 70% | 85% | TBD |

## 🐛 Debugging Tests

### Common Issues
```bash
# Test timeouts
jest.setTimeout(30000);

# Database connection issues
export NODE_ENV=test

# Mock issues
jest.clearAllMocks(); // In beforeEach

# Memory leaks
--detectOpenHandles --forceExit
```

### Test Debugging
```javascript
// Enable verbose output
describe.only('Specific test', () => {
  // Only run this test
});

it.skip('Broken test', () => {
  // Skip this test temporarily
});
```

## 🔄 Refactoring Workflow

1. **Pre-Refactor**: Run `npm run test:coverage` → All green ✅
2. **Refactor Step**: Make incremental changes
3. **Test Step**: Run `npm test` → Verify no regressions
4. **Repeat**: Until monolith is fully decomposed
5. **Post-Refactor**: Update tests for new architecture

## 📝 Test Writing Guidelines

### DO ✅
- Test happy paths AND error cases
- Use descriptive test names
- Clean up test data after each test
- Mock external dependencies
- Test edge cases and validation

### DON'T ❌
- Test implementation details
- Leave test data in database
- Skip error handling tests
- Use real external services
- Write tests that depend on each other

## 🚀 Next Steps

1. **Run the test suite** to establish baseline
2. **Fix any failing tests** before refactoring
3. **Begin refactoring** the largest monolith first (`voiceNotes.js`)
4. **Run tests after each module extraction**
5. **Update tests** to reflect new architecture

---

**⚠️ IMPORTANT**: Never refactor without running tests first. This test suite is your safety net for breaking down the massive monoliths safely. 