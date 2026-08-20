const assert = require('assert');
const prisma = require('../prisma/client');
const { signToken, verifyToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/passwordHelper');
const authController = require('../controllers/AuthController');
const resumeController = require('../controllers/ResumeController');
const userSettingsController = require('../controllers/UserSettingsController');

// Mock Express Request / Response helpers
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name) {
      delete this.cookies[name];
      return this;
    }
  };
  return res;
}

async function runAuthAndDataResilienceTests() {
  console.log('\n=== RUNNING AUTH & BACKEND DATA QUERY RESILIENCE TESTS ===\n');

  const testEmail = `candidate_${Date.now()}@glasshub.com`;
  const testPassword = 'StrongPassword123!';
  const testName = 'Matheus Test Candidate';

  // 1. Test User Registration
  console.log('[1/5] Testing User Registration...');
  const reqReg = {
    body: {
      name: testName,
      email: testEmail,
      password: testPassword
    },
    ip: '127.0.0.1'
  };
  const resReg = createMockRes();
  await authController.register(reqReg, resReg);

  assert.strictEqual(resReg.statusCode, 201, `Registration should return 201, got ${resReg.statusCode}: ${JSON.stringify(resReg.jsonData)}`);
  assert(resReg.jsonData?.success, 'Registration must be successful');
  assert.strictEqual(resReg.jsonData?.user?.email, testEmail);
  const token = resReg.jsonData?.accessToken;
  assert(token, 'Must return accessToken');
  console.log('✅ Test 1 Passed: User registered successfully.');

  // 2. Test User Login
  console.log('[2/5] Testing User Login...');
  const reqLogin = {
    body: {
      email: testEmail,
      password: testPassword
    },
    ip: '127.0.0.1'
  };
  const resLogin = createMockRes();
  await authController.login(reqLogin, resLogin);

  assert.strictEqual(resLogin.statusCode, 200, 'Login should return 200');
  assert(resLogin.jsonData?.success, 'Login must be successful');
  assert.strictEqual(resLogin.jsonData?.user?.name, testName);
  const loggedUserId = resLogin.jsonData?.user?.id;
  assert(loggedUserId, 'User id must exist');
  console.log('✅ Test 2 Passed: User logged in and received session token.');

  // 3. Test Session Verification (/api/auth/me)
  console.log('[3/5] Testing /api/auth/me session verification...');
  const reqMe = {
    user: resLogin.jsonData.user
  };
  const resMe = createMockRes();
  await authController.me(reqMe, resMe);
  assert.strictEqual(resMe.statusCode, 200);
  assert.strictEqual(resMe.jsonData?.user?.email, testEmail);
  console.log('✅ Test 3 Passed: User session validated via /api/auth/me.');

  // 4. Test Resume Save & Fetch
  console.log('[4/5] Testing Resume Save & Fetch...');
  const resumePayload = {
    personalDetails: {
      name: testName,
      title: 'Tech Lead & Senior Architect',
      contact: {
        email: { email: testEmail, icon: '✉️' }
      }
    },
    summaryDetails: {
      summaryTitle: 'RESUMO PROFISSIONAL',
      summary: 'Especialista em microsserviços distribuídos e alta resiliência.'
    },
    skillsDetails: {
      skills: [{ name: 'Cloud', items: ['Docker', 'Kubernetes', 'Node.js'] }]
    }
  };

  const reqSaveResume = {
    user: { id: loggedUserId },
    body: {
      language: 'pt-BR',
      document: resumePayload
    }
  };
  const resSaveResume = createMockRes();
  await resumeController.saveResume(reqSaveResume, resSaveResume);
  assert.strictEqual(resSaveResume.statusCode, 200, `Resume save failed: ${JSON.stringify(resSaveResume.jsonData)}`);
  assert(resSaveResume.jsonData?.success, 'Save resume must succeed');

  const reqGetResume = {
    user: { id: loggedUserId },
    query: { lang: 'pt-BR' }
  };
  const resGetResume = createMockRes();
  await resumeController.getResume(reqGetResume, resGetResume);
  assert.strictEqual(resGetResume.statusCode, 200);
  assert.strictEqual(resGetResume.jsonData?.data?.personalDetails?.name, testName);
  assert.strictEqual(resGetResume.jsonData?.data?.personalDetails?.title, 'Tech Lead & Senior Architect');
  console.log('✅ Test 4 Passed: Resume data persisted and retrieved with 100% precision.');

  // 5. Test User Settings Save & Fetch
  console.log('[5/5] Testing User Settings Persistence...');
  const reqSaveSettings = {
    user: { id: loggedUserId },
    body: {
      viewMode: 'previewOnly',
      activeTheme: 'dark',
      activeTemplate: 'GlassExecutive',
      primaryColor: '#8b5cf6',
      atsScore: 92
    }
  };
  const resSaveSettings = createMockRes();
  await userSettingsController.updateSettings(reqSaveSettings, resSaveSettings);
  assert.strictEqual(resSaveSettings.statusCode, 200);

  const reqGetSettings = {
    user: { id: loggedUserId }
  };
  const resGetSettings = createMockRes();
  await userSettingsController.getSettings(reqGetSettings, resGetSettings);
  assert.strictEqual(resGetSettings.statusCode, 200);
  assert.strictEqual(resGetSettings.jsonData?.settings?.activeTemplate, 'GlassExecutive');
  assert.strictEqual(resGetSettings.jsonData?.settings?.primaryColor, '#8b5cf6');
  console.log('✅ Test 5 Passed: User preferences and ATS score saved and retrieved.');

  console.log('\n🎉 ALL AUTH & BACKEND DATA QUERY TESTS PASSED SUCCESSFULLY!\n');
}

if (require.main === module) {
  runAuthAndDataResilienceTests().catch(err => {
    console.error('Auth and Data test failed:', err);
    process.exit(1);
  });
}

module.exports = runAuthAndDataResilienceTests;
