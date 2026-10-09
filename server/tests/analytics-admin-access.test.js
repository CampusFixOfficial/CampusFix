const { test } = require('node:test');
const assert = require('node:assert/strict');
const analyticsRouter = require('../routes/analytics');
const { protect, adminOnly } = require('../core/auth/middleware');

const landscapeRoute = analyticsRouter.stack.find((layer) => layer.route?.path === '/campus-landscape')?.route;

test('campus landscape endpoint requires authentication and the Admin role', () => {
  assert.ok(landscapeRoute, 'the landscape endpoint is registered');
  const handlers = landscapeRoute.stack.map((layer) => layer.handle);
  assert.equal(handlers[0], protect, 'authentication runs before role validation');
  assert.ok(handlers.includes(adminOnly), 'Authority staff do not share the live landscape endpoint');
});

test('Admin-only role guard rejects staff and accepts Admin accounts', () => {
  const invoke = (role) => {
    const result = { statusCode: null, body: null, continued: false };
    const response = {
      status(code) { result.statusCode = code; return this; },
      json(body) { result.body = body; return this; },
    };
    adminOnly({ user: { role } }, response, () => { result.continued = true; });
    return result;
  };

  const staff = invoke('staff');
  assert.equal(staff.statusCode, 403);
  assert.equal(staff.continued, false);
  const admin = invoke('admin');
  assert.equal(admin.continued, true);
  assert.equal(admin.statusCode, null);
});
