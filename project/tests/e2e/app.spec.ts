import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

const backendPort = Number(process.env.E2E_BACKEND_PORT || 3100);
const apiOrigin = process.env.E2E_API_ORIGIN || `http://127.0.0.1:${backendPort}`;
const adminEmail = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@scnjobs.com';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Jatin@scn5320';
const runId = `${Date.now()}`;

type Lookup = { id: number; name?: string; city?: string; locality?: string };
type RecruiterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  industryIds: number[];
};

let api: APIRequestContext;
let adminToken = '';
let industry: Lookup;
let location: Lookup;
let recruiter: RecruiterPayload;
let recruiterId = '';
let recruiterToken = '';
let createdJobId = '';
let draftJobId = '';

async function loginByApi(email: string, password: string) {
  const response = await api.post('/api/auth/login', { data: { email, password } });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return body.data as { token: string; user: { role: string } };
}

async function getAdminHeaders() {
  return { Authorization: `Bearer ${adminToken}` };
}

async function signIn(page: Page, email: string, password: string, expectedPath: RegExp) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(expectedPath);
}

test.describe.serial('SCN Jobs complete application flow', () => {
  test.beforeAll(async () => {
    api = await request.newContext({ baseURL: apiOrigin });

    const adminSession = await loginByApi(adminEmail, adminPassword);
    expect(adminSession.user.role).toBe('super_admin');
    adminToken = adminSession.token;

    const [industriesResponse, locationsResponse] = await Promise.all([
      api.get('/api/master/industries', { headers: await getAdminHeaders() }),
      api.get('/api/master/locations', { headers: await getAdminHeaders() }),
    ]);
    expect(industriesResponse.ok(), await industriesResponse.text()).toBeTruthy();
    expect(locationsResponse.ok(), await locationsResponse.text()).toBeTruthy();

    industry = (await industriesResponse.json()).data[0];
    location = (await locationsResponse.json()).data[0];
    expect(industry?.id).toBeTruthy();
    expect(location?.id).toBeTruthy();

    recruiter = {
      name: `E2E Recruiter ${runId}`,
      email: `e2e.recruiter.${runId}@example.com`,
      phone: `8${runId.slice(-9)}`,
      password: 'Password123',
      industryIds: [industry.id],
    };
  });

  test.afterAll(async () => {
    if (draftJobId) {
      await api.delete(`/api/jobs/${draftJobId}`, {
        headers: { Authorization: `Bearer ${recruiterToken || adminToken}` },
      }).catch(() => undefined);
    }
    if (recruiterId) {
      await api.delete(`/api/admin/recruiters/${recruiterId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => undefined);
    }
    await api?.dispose();
  });

  test('validates public header, search, worker signup, signin, logout, sidebar, admin recruiter CRUD, recruiter dashboard, job CRUD, and protected routes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await page.getByLabel('Job title, skill, or company').fill('Frontend Developer');
    await page.getByLabel('Location').fill('Remote');
    await page.getByRole('link', { name: /search jobs/i }).click();
    await expect(page).toHaveURL(/\/jobs\?q=Frontend%20Developer&loc=Remote/);
    await expect(page.getByRole('button', { name: /filters/i })).toBeVisible();

    const workerEmail = `e2e.worker.${runId}@example.com`;
    const workerPhone = `7${runId.slice(-9)}`;
    await page.goto('/worker/register');
    const registerResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/auth/worker/register') && response.request().method() === 'POST',
    );
    await page.getByLabel('Full Name').fill(`E2E Worker ${runId}`);
    await page.getByLabel('Email Address').fill(workerEmail);
    await page.getByLabel('Phone Number').fill(workerPhone);
    await page.getByLabel('Password').fill('Password123');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /create account/i }).click();
    const registerResponse = await registerResponsePromise;
    expect(registerResponse.ok(), await registerResponse.text()).toBeTruthy();
    const registerBody = await registerResponse.json();
    expect(registerBody.data.devOtp).toMatch(/^\d{6}$/);
    await expect(page).toHaveURL(/\/worker\/verify-otp/);

    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await signIn(page, adminEmail, adminPassword, /\/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();

    const adminSidebar = page.getByLabel('Admin Panel navigation');
    await expect(adminSidebar).toBeVisible();
    const openWidth = await adminSidebar.evaluate((node) => node.getBoundingClientRect().width);
    expect(openWidth).toBeGreaterThan(200);
    await page.getByRole('button', { name: /close sidebar/i }).click();
    const closedWidth = await adminSidebar.evaluate((node) => node.getBoundingClientRect().width);
    expect(closedWidth).toBeLessThan(5);
    await page.getByRole('button', { name: /open sidebar/i }).click();
    await expect(page.getByRole('link', { name: /recruiters/i })).toBeVisible();

    await page.goto('/admin/recruiters');
    await page.getByPlaceholder('Search by name, email, or company').fill('definitely missing');
    await expect(page.getByText(/jobs posted/i).first()).toBeHidden();
    await page.getByPlaceholder('Search by name, email, or company').fill('');
    await page.getByRole('button', { name: /add recruiter/i }).click();
    await page.getByPlaceholder('John Doe').fill(recruiter.name);
    await page.getByPlaceholder('john@company.com').fill(recruiter.email);
    await page.getByPlaceholder('9876543210').fill(recruiter.phone);
    await page.getByPlaceholder('Minimum 6 characters').fill(recruiter.password);
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /create recruiter/i }).click();
    await expect(page.getByText(recruiter.name)).toBeVisible();

    const recruitersResponse = await api.get('/api/admin/recruiters', { headers: await getAdminHeaders() });
    expect(recruitersResponse.ok(), await recruitersResponse.text()).toBeTruthy();
    const recruiters = (await recruitersResponse.json()).data as Array<{ id: string; email: string }>;
    recruiterId = recruiters.find((item) => item.email === recruiter.email)?.id || '';
    expect(recruiterId).toBeTruthy();

    await page.getByPlaceholder('Search by name, email, or company').fill(recruiter.email);
    await page.getByRole('button', { name: /edit/i }).click();
    await page.getByPlaceholder('9876543210').fill(`9${runId.slice(-9)}`);
    await page.getByRole('button', { name: /update recruiter/i }).click();
    await expect(page.getByText('Recruiter updated successfully')).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`Delete ${recruiter.name}`) }).click();
    await page.getByRole('button', { name: /^delete recruiter$/i }).click();
    await expect(page.getByText('Recruiter deleted')).toBeVisible();
    recruiterId = '';

    const recreateResponse = await api.post('/api/admin/recruiters', {
      headers: await getAdminHeaders(),
      data: recruiter,
    });
    expect(recreateResponse.ok(), await recreateResponse.text()).toBeTruthy();
    recruiterId = (await recreateResponse.json()).data.id;

    const recruiterSession = await loginByApi(recruiter.email, recruiter.password);
    expect(recruiterSession.user.role).toBe('recruiter');
    recruiterToken = recruiterSession.token;

    await page.locator('header button').last().click();
    await page.getByText('Sign Out').click();
    await expect(page).toHaveURL(/\/login/);
    await signIn(page, recruiter.email, recruiter.password, /\/recruiter\/dashboard/);
    await expect(page.getByRole('heading', { name: /recruiter dashboard/i })).toBeVisible();

    const jobPayload = {
      title: `E2E Worker Opening ${runId}`,
      description: 'End-to-end job creation validates recruiter job APIs.',
      industryId: industry.id,
      locationId: location.id,
      headcountRequired: 2,
      wageMin: 10000,
      wageMax: 20000,
      shiftType: 'day',
      jobType: 'full_time',
      responsibilities: ['Run the E2E workflow'],
      requirements: ['Understand test flows'],
      benefits: ['Reliable releases'],
    };

    const createJobResponse = await api.post('/api/jobs', {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: jobPayload,
    });
    expect(createJobResponse.ok(), await createJobResponse.text()).toBeTruthy();
    createdJobId = (await createJobResponse.json()).data.id;

    const editJobResponse = await api.patch(`/api/jobs/${createdJobId}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { title: `${jobPayload.title} Updated` },
    });
    expect(editJobResponse.ok(), await editJobResponse.text()).toBeTruthy();

    const publishJobResponse = await api.patch(`/api/jobs/${createdJobId}/status`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { status: 'active' },
    });
    expect(publishJobResponse.ok(), await publishJobResponse.text()).toBeTruthy();

    await page.goto('/recruiter/jobs');
    await expect(page.getByText(`${jobPayload.title} Updated`)).toBeVisible();

    const closeJobResponse = await api.patch(`/api/jobs/${createdJobId}/status`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { status: 'closed' },
    });
    expect(closeJobResponse.ok(), await closeJobResponse.text()).toBeTruthy();

    const draftJobResponse = await api.post('/api/jobs', {
      headers: { Authorization: `Bearer ${recruiterToken}` },
      data: { ...jobPayload, title: `Draft Delete ${runId}` },
    });
    expect(draftJobResponse.ok(), await draftJobResponse.text()).toBeTruthy();
    draftJobId = (await draftJobResponse.json()).data.id;
    const deleteDraftResponse = await api.delete(`/api/jobs/${draftJobId}`, {
      headers: { Authorization: `Bearer ${recruiterToken}` },
    });
    expect(deleteDraftResponse.ok(), await deleteDraftResponse.text()).toBeTruthy();
    draftJobId = '';

    await page.evaluate(() => localStorage.clear());
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login/);

    const jobsApiResponse = await api.get('/api/jobs');
    expect(jobsApiResponse.ok(), await jobsApiResponse.text()).toBeTruthy();
  });
});
