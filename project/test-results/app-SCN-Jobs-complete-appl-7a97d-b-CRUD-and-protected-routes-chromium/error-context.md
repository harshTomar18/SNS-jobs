# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> SCN Jobs complete application flow >> validates public header, search, worker signup, signin, logout, sidebar, admin recruiter CRUD, recruiter dashboard, job CRUD, and protected routes
- Location: tests/e2e/app.spec.ts:90:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /sign in/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('link', { name: /sign in/i })

```

```yaml
- banner:
  - link "SCN Jobs":
    - /url: /
    - img
    - text: SCN Jobs
  - button "Toggle theme":
    - img
    - img
    - text: Toggle theme
- img
- text: Trusted by 3,500+ companies
- heading "Find your next opportunity faster than ever" [level=1]
- paragraph: The modern job portal connecting talent with opportunity. Search thousands of jobs, track applications, and get hired — all in one place.
- img
- textbox "Job title, skill, or company"
- img
- textbox "Location"
- link "Search Jobs":
  - /url: /jobs?q=&loc=
  - text: Search Jobs
  - img
- text: "Popular:"
- link "Frontend Developer":
  - /url: /jobs
- link "Product Designer":
  - /url: /jobs
- link "Remote":
  - /url: /jobs
- link "Fresher":
  - /url: /jobs
- paragraph: Trusted by leading companies worldwide
- img
- text: SCN Jobs
- img
- text: Manufacturing
- img
- text: Healthcare
- img
- text: Logistics
- img
- text: Retail
- img
- text: Hospitality
- heading "Featured Jobs" [level=2]
- paragraph: Hand-picked opportunities from top companies
- img
- link "Cement/Concrete/Readymix Worker — Opening 10":
  - /url: /jobs/16add0d3-f6cf-4cac-a7ba-2a19a2893581
  - heading "Cement/Concrete/Readymix Worker — Opening 10" [level=3]
- paragraph: Test Recruiter 10
- button "Save job":
  - img
- img
- text: ₹12000 - 18000
- img
- text: Mumbai
- img
- text: 0-3 yrs
- img
- text: 2 openings
- img
- text: 5h ago Accounting Functions onsite Fresher Friendly
- link "Apply Now":
  - /url: /jobs/16add0d3-f6cf-4cac-a7ba-2a19a2893581
- img
- link "Bio Technology & Life Sciences Worker — Opening 9":
  - /url: /jobs/2912b7a5-0efb-401c-938a-228cbe1b251f
  - heading "Bio Technology & Life Sciences Worker — Opening 9" [level=3]
- paragraph: Test Recruiter 9
- button "Save job":
  - img
- img
- text: ₹12000 - 18000
- img
- text: Lucknow
- img
- text: 0-3 yrs
- img
- text: 2 openings
- img
- text: 5h ago Accounting onsite Fresher Friendly
- link "Apply Now":
  - /url: /jobs/2912b7a5-0efb-401c-938a-228cbe1b251f
- img
- link "Beverages/Liquor Worker — Opening 8":
  - /url: /jobs/468b6b72-fe83-44a1-ad59-0f0a0ccbb443
  - heading "Beverages/Liquor Worker — Opening 8" [level=3]
- paragraph: Test Recruiter 8
- button "Save job":
  - img
- img
- text: ₹12000 - 18000
- img
- text: Kanpur
- img
- text: 0-3 yrs
- img
- text: 2 openings
- img
- text: 5h ago Accountancy onsite Fresher Friendly
- link "Apply Now":
  - /url: /jobs/468b6b72-fe83-44a1-ad59-0f0a0ccbb443
- img
- link "Banking/Accounting/Financial Services Worker — Opening 7":
  - /url: /jobs/69f918c7-7dc0-467f-80e8-d31f4ba4d481
  - heading "Banking/Accounting/Financial Services Worker — Opening 7" [level=3]
- paragraph: Test Recruiter 7
- button "Save job":
  - img
- img
- text: ₹12000 - 18000
- img
- text: Meerut
- img
- text: 0-3 yrs
- img
- text: 2 openings
- img
- text: 5h ago Account Relationship Management onsite Fresher Friendly
- link "Apply Now":
  - /url: /jobs/69f918c7-7dc0-467f-80e8-d31f4ba4d481
- img
- link "Automotive/Automobile/Ancillaries Worker — Opening 6":
  - /url: /jobs/704dd0db-9ab8-4089-a6f0-05dd04718116
  - heading "Automotive/Automobile/Ancillaries Worker — Opening 6" [level=3]
- paragraph: Test Recruiter 6
- button "Save job":
  - img
- img
- text: ₹12000 - 18000
- img
- text: Ghaziabad
- img
- text: 0-3 yrs
- img
- text: 2 openings
- img
- text: 5h ago Account Receivable onsite Fresher Friendly
- link "Apply Now":
  - /url: /jobs/704dd0db-9ab8-4089-a6f0-05dd04718116
- img
- link "Architecture/Interior Design Worker — Opening 5":
  - /url: /jobs/cebfe2e8-3d6d-45a9-8dcd-c4a8ce35671a
  - heading "Architecture/Interior Design Worker — Opening 5" [level=3]
- paragraph: Test Recruiter 5
- button "Save job":
  - img
- img
- text: ₹12000 - 18000
- img
- text: Faridabad
- img
- text: 0-3 yrs
- img
- text: 2 openings
- img
- text: 5h ago Account Management onsite Fresher Friendly
- link "Apply Now":
  - /url: /jobs/cebfe2e8-3d6d-45a9-8dcd-c4a8ce35671a
- heading "Explore by Industry" [level=2]
- paragraph: Find opportunities in the industry that matches your passion
- link "Technology 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Technology
  - paragraph: 0 jobs
- link "Fintech 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Fintech
  - paragraph: 0 jobs
- link "Healthcare 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Healthcare
  - paragraph: 0 jobs
- link "E-Commerce 0 jobs":
  - /url: /jobs
  - img
  - paragraph: E-Commerce
  - paragraph: 0 jobs
- link "Education 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Education
  - paragraph: 0 jobs
- link "Manufacturing 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Manufacturing
  - paragraph: 0 jobs
- heading "Popular Locations" [level=2]
- paragraph: Discover jobs in top cities across India
- link "Delhi NCR 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Delhi NCR
  - paragraph: 0 jobs
  - img
- link "Noida 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Noida
  - paragraph: 0 jobs
  - img
- link "Gurugram 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Gurugram
  - paragraph: 0 jobs
  - img
- link "Mumbai 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Mumbai
  - paragraph: 0 jobs
  - img
- link "Pune 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Pune
  - paragraph: 0 jobs
  - img
- link "Lucknow 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Lucknow
  - paragraph: 0 jobs
  - img
- link "Patna 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Patna
  - paragraph: 0 jobs
  - img
- link "Jaipur 0 jobs":
  - /url: /jobs
  - img
  - paragraph: Jaipur
  - paragraph: 0 jobs
  - img
- heading "SCN Jobs How It Works" [level=2]
- paragraph: Get hired in four simple steps
- img
- text: "1"
- heading "Create Your Profile" [level=3]
- paragraph: Sign up in minutes and build a profile that stands out to recruiters.
- img
- text: "2"
- heading "Discover Jobs" [level=3]
- paragraph: Search and filter through thousands of jobs that match your skills and preferences.
- img
- text: "3"
- heading "Apply with One Click" [level=3]
- paragraph: Apply to jobs instantly and track your application status in real-time.
- img
- text: "4"
- heading "Get Hired" [level=3]
- paragraph: Receive interview invites and offers, all managed in one beautiful dashboard.
- paragraph: 12,000+
- paragraph: Active Jobs
- paragraph: 3,500+
- paragraph: Companies Hiring
- paragraph: 1.2M+
- paragraph: Job Seekers
- paragraph: 94%
- paragraph: Success Rate
- heading "Loved by Workers & Recruiters" [level=2]
- paragraph: Don't just take our word for it
- img
- img
- img
- img
- img
- paragraph: “SCN Jobs helps us manage openings, candidates, and hiring updates in one place.”
- text: R
- paragraph: Recruitment Team
- paragraph: SCN Jobs Partner
- img
- img
- img
- img
- img
- paragraph: “The application tracking flow makes it easy to know what is happening after applying.”
- text: W
- paragraph: Worker Success
- paragraph: Registered Candidate
- img
- img
- img
- img
- img
- paragraph: “Candidate search and category-based access keep our hiring workflow focused.”
- text: H
- paragraph: Hiring Manager
- paragraph: Recruiter
- heading "Take SCN Jobs with you" [level=2]
- paragraph: Get instant job alerts, track applications, and never miss an opportunity. Download our mobile app today.
- button "App Store":
  - img
  - text: App Store
- button "Google Play":
  - img
  - text: Google Play
- img
- heading "Frequently Asked Questions" [level=2]
- paragraph: Everything you need to know about SCN Jobs
- heading "How do I create a worker account?" [level=3]:
  - button "How do I create a worker account?":
    - text: How do I create a worker account?
    - img
- heading "Is SCN Jobs free for workers?" [level=3]:
  - button "Is SCN Jobs free for workers?":
    - text: Is SCN Jobs free for workers?
    - img
- heading "How do recruiters post jobs?" [level=3]:
  - button "How do recruiters post jobs?":
    - text: How do recruiters post jobs?
    - img
- heading "Can I track application status?" [level=3]:
  - button "Can I track application status?":
    - text: Can I track application status?
    - img
- heading "How does candidate search work?" [level=3]:
  - button "How does candidate search work?":
    - text: How does candidate search work?
    - img
- heading "Is the app mobile responsive?" [level=3]:
  - button "Is the app mobile responsive?":
    - text: Is the app mobile responsive?
    - img
- heading "Ready to find your next opportunity?" [level=2]
- paragraph: Join millions of workers and recruiters on SCN Jobs. It's free to get started.
- link "Get Started Free":
  - /url: /worker/register
  - text: Get Started Free
  - img
- link "I'm Hiring":
  - /url: /login
- contentinfo:
  - link "SCN Jobs":
    - /url: /
    - img
    - text: SCN Jobs
  - paragraph: The modern job portal connecting talent with opportunity. Built for the future of work.
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
    - img
  - heading "For Workers" [level=3]
  - list:
    - listitem:
      - link "Browse Jobs":
        - /url: /jobs
    - listitem:
      - link "Create Profile":
        - /url: /worker/register
    - listitem:
      - link "Login":
        - /url: /login
    - listitem:
      - link "Career Resources":
        - /url: /#how-it-works
  - heading "For Recruiters" [level=3]
  - list:
    - listitem:
      - link "Post a Job":
        - /url: /login
    - listitem:
      - link "Search Candidates":
        - /url: /login
    - listitem:
      - link "Recruiter Login":
        - /url: /login
    - listitem:
      - link "Pricing":
        - /url: /#how-it-works
  - heading "Company" [level=3]
  - list:
    - listitem:
      - link "About Us":
        - /url: /
    - listitem:
      - link "Careers":
        - /url: /jobs
    - listitem:
      - link "Blog":
        - /url: /
    - listitem:
      - link "Contact":
        - /url: /
  - heading "Legal" [level=3]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: /
    - listitem:
      - link "Terms of Service":
        - /url: /
    - listitem:
      - link "Cookie Policy":
        - /url: /
    - listitem:
      - link "GDPR":
        - /url: /
  - paragraph: © 2026 SCN Jobs. All rights reserved.
  - paragraph: Made with care in India
- alert
```

# Test source

```ts
  1   | import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
  2   | 
  3   | const backendPort = Number(process.env.E2E_BACKEND_PORT || 3100);
  4   | const apiOrigin = process.env.E2E_API_ORIGIN || `http://127.0.0.1:${backendPort}`;
  5   | const adminEmail = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@scnjobs.com';
  6   | const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Jatin@scn5320';
  7   | const runId = `${Date.now()}`;
  8   | 
  9   | type Lookup = { id: number; name?: string; city?: string; locality?: string };
  10  | type RecruiterPayload = {
  11  |   name: string;
  12  |   email: string;
  13  |   phone: string;
  14  |   password: string;
  15  |   industryIds: number[];
  16  | };
  17  | 
  18  | let api: APIRequestContext;
  19  | let adminToken = '';
  20  | let industry: Lookup;
  21  | let location: Lookup;
  22  | let recruiter: RecruiterPayload;
  23  | let recruiterId = '';
  24  | let recruiterToken = '';
  25  | let createdJobId = '';
  26  | let draftJobId = '';
  27  | 
  28  | async function loginByApi(email: string, password: string) {
  29  |   const response = await api.post('/api/auth/login', { data: { email, password } });
  30  |   expect(response.ok(), await response.text()).toBeTruthy();
  31  |   const body = await response.json();
  32  |   return body.data as { token: string; user: { role: string } };
  33  | }
  34  | 
  35  | async function getAdminHeaders() {
  36  |   return { Authorization: `Bearer ${adminToken}` };
  37  | }
  38  | 
  39  | async function signIn(page: Page, email: string, password: string, expectedPath: RegExp) {
  40  |   await page.goto('/login');
  41  |   await page.getByLabel('Email').fill(email);
  42  |   await page.getByLabel('Password').fill(password);
  43  |   await page.getByRole('button', { name: /sign in/i }).click();
  44  |   await expect(page).toHaveURL(expectedPath);
  45  | }
  46  | 
  47  | test.describe.serial('SCN Jobs complete application flow', () => {
  48  |   test.beforeAll(async () => {
  49  |     api = await request.newContext({ baseURL: apiOrigin });
  50  | 
  51  |     const adminSession = await loginByApi(adminEmail, adminPassword);
  52  |     expect(adminSession.user.role).toBe('super_admin');
  53  |     adminToken = adminSession.token;
  54  | 
  55  |     const [industriesResponse, locationsResponse] = await Promise.all([
  56  |       api.get('/api/master/industries', { headers: await getAdminHeaders() }),
  57  |       api.get('/api/master/locations', { headers: await getAdminHeaders() }),
  58  |     ]);
  59  |     expect(industriesResponse.ok(), await industriesResponse.text()).toBeTruthy();
  60  |     expect(locationsResponse.ok(), await locationsResponse.text()).toBeTruthy();
  61  | 
  62  |     industry = (await industriesResponse.json()).data[0];
  63  |     location = (await locationsResponse.json()).data[0];
  64  |     expect(industry?.id).toBeTruthy();
  65  |     expect(location?.id).toBeTruthy();
  66  | 
  67  |     recruiter = {
  68  |       name: `E2E Recruiter ${runId}`,
  69  |       email: `e2e.recruiter.${runId}@example.com`,
  70  |       phone: `8${runId.slice(-9)}`,
  71  |       password: 'Password123',
  72  |       industryIds: [industry.id],
  73  |     };
  74  |   });
  75  | 
  76  |   test.afterAll(async () => {
  77  |     if (draftJobId) {
  78  |       await api.delete(`/api/jobs/${draftJobId}`, {
  79  |         headers: { Authorization: `Bearer ${recruiterToken || adminToken}` },
  80  |       }).catch(() => undefined);
  81  |     }
  82  |     if (recruiterId) {
  83  |       await api.delete(`/api/admin/recruiters/${recruiterId}`, {
  84  |         headers: { Authorization: `Bearer ${adminToken}` },
  85  |       }).catch(() => undefined);
  86  |     }
  87  |     await api?.dispose();
  88  |   });
  89  | 
  90  |   test('validates public header, search, worker signup, signin, logout, sidebar, admin recruiter CRUD, recruiter dashboard, job CRUD, and protected routes', async ({ page }) => {
  91  |     await page.goto('/');
  92  |     await page.evaluate(() => localStorage.clear());
  93  |     await page.reload();
  94  | 
> 95  |     await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
      |                                                                ^ Error: expect(locator).toBeVisible() failed
  96  |     await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  97  |     await page.getByLabel('Job title, skill, or company').fill('Frontend Developer');
  98  |     await page.getByLabel('Location').fill('Remote');
  99  |     await page.getByRole('link', { name: /search jobs/i }).click();
  100 |     await expect(page).toHaveURL(/\/jobs\?q=Frontend%20Developer&loc=Remote/);
  101 |     await expect(page.getByRole('button', { name: /filters/i })).toBeVisible();
  102 | 
  103 |     const workerEmail = `e2e.worker.${runId}@example.com`;
  104 |     const workerPhone = `7${runId.slice(-9)}`;
  105 |     await page.goto('/worker/register');
  106 |     const registerResponsePromise = page.waitForResponse((response) =>
  107 |       response.url().includes('/api/auth/worker/register') && response.request().method() === 'POST',
  108 |     );
  109 |     await page.getByLabel('Full Name').fill(`E2E Worker ${runId}`);
  110 |     await page.getByLabel('Email Address').fill(workerEmail);
  111 |     await page.getByLabel('Phone Number').fill(workerPhone);
  112 |     await page.getByLabel('Password').fill('Password123');
  113 |     await page.getByRole('checkbox').check();
  114 |     await page.getByRole('button', { name: /create account/i }).click();
  115 |     const registerResponse = await registerResponsePromise;
  116 |     expect(registerResponse.ok(), await registerResponse.text()).toBeTruthy();
  117 |     const registerBody = await registerResponse.json();
  118 |     expect(registerBody.data.devOtp).toMatch(/^\d{6}$/);
  119 |     await expect(page).toHaveURL(/\/worker\/verify-otp/);
  120 | 
  121 |     await page.goto('/login');
  122 |     await page.getByRole('button', { name: /sign in/i }).click();
  123 |     await expect(page.getByText('Enter a valid email')).toBeVisible();
  124 |     await signIn(page, adminEmail, adminPassword, /\/admin\/dashboard/);
  125 |     await expect(page.getByRole('heading', { name: /admin dashboard/i })).toBeVisible();
  126 | 
  127 |     const adminSidebar = page.getByLabel('Admin Panel navigation');
  128 |     await expect(adminSidebar).toBeVisible();
  129 |     const openWidth = await adminSidebar.evaluate((node) => node.getBoundingClientRect().width);
  130 |     expect(openWidth).toBeGreaterThan(200);
  131 |     await page.getByRole('button', { name: /close sidebar/i }).click();
  132 |     const closedWidth = await adminSidebar.evaluate((node) => node.getBoundingClientRect().width);
  133 |     expect(closedWidth).toBeLessThan(5);
  134 |     await page.getByRole('button', { name: /open sidebar/i }).click();
  135 |     await expect(page.getByRole('link', { name: /recruiters/i })).toBeVisible();
  136 | 
  137 |     await page.goto('/admin/recruiters');
  138 |     await page.getByPlaceholder('Search by name, email, or company').fill('definitely missing');
  139 |     await expect(page.getByText(/jobs posted/i).first()).toBeHidden();
  140 |     await page.getByPlaceholder('Search by name, email, or company').fill('');
  141 |     await page.getByRole('button', { name: /add recruiter/i }).click();
  142 |     await page.getByPlaceholder('John Doe').fill(recruiter.name);
  143 |     await page.getByPlaceholder('john@company.com').fill(recruiter.email);
  144 |     await page.getByPlaceholder('9876543210').fill(recruiter.phone);
  145 |     await page.getByPlaceholder('Minimum 6 characters').fill(recruiter.password);
  146 |     await page.locator('input[type="checkbox"]').first().check();
  147 |     await page.getByRole('button', { name: /create recruiter/i }).click();
  148 |     await expect(page.getByText(recruiter.name)).toBeVisible();
  149 | 
  150 |     const recruitersResponse = await api.get('/api/admin/recruiters', { headers: await getAdminHeaders() });
  151 |     expect(recruitersResponse.ok(), await recruitersResponse.text()).toBeTruthy();
  152 |     const recruiters = (await recruitersResponse.json()).data as Array<{ id: string; email: string }>;
  153 |     recruiterId = recruiters.find((item) => item.email === recruiter.email)?.id || '';
  154 |     expect(recruiterId).toBeTruthy();
  155 | 
  156 |     await page.getByPlaceholder('Search by name, email, or company').fill(recruiter.email);
  157 |     await page.getByRole('button', { name: /edit/i }).click();
  158 |     await page.getByPlaceholder('9876543210').fill(`9${runId.slice(-9)}`);
  159 |     await page.getByRole('button', { name: /update recruiter/i }).click();
  160 |     await expect(page.getByText('Recruiter updated successfully')).toBeVisible();
  161 | 
  162 |     await page.getByRole('button', { name: new RegExp(`Delete ${recruiter.name}`) }).click();
  163 |     await page.getByRole('button', { name: /^delete recruiter$/i }).click();
  164 |     await expect(page.getByText('Recruiter deleted')).toBeVisible();
  165 |     recruiterId = '';
  166 | 
  167 |     const recreateResponse = await api.post('/api/admin/recruiters', {
  168 |       headers: await getAdminHeaders(),
  169 |       data: recruiter,
  170 |     });
  171 |     expect(recreateResponse.ok(), await recreateResponse.text()).toBeTruthy();
  172 |     recruiterId = (await recreateResponse.json()).data.id;
  173 | 
  174 |     const recruiterSession = await loginByApi(recruiter.email, recruiter.password);
  175 |     expect(recruiterSession.user.role).toBe('recruiter');
  176 |     recruiterToken = recruiterSession.token;
  177 | 
  178 |     await page.locator('header button').last().click();
  179 |     await page.getByText('Sign Out').click();
  180 |     await expect(page).toHaveURL(/\/login/);
  181 |     await signIn(page, recruiter.email, recruiter.password, /\/recruiter\/dashboard/);
  182 |     await expect(page.getByRole('heading', { name: /recruiter dashboard/i })).toBeVisible();
  183 | 
  184 |     const jobPayload = {
  185 |       title: `E2E Worker Opening ${runId}`,
  186 |       description: 'End-to-end job creation validates recruiter job APIs.',
  187 |       industryId: industry.id,
  188 |       locationId: location.id,
  189 |       headcountRequired: 2,
  190 |       wageMin: 10000,
  191 |       wageMax: 20000,
  192 |       shiftType: 'day',
  193 |       jobType: 'full_time',
  194 |       responsibilities: ['Run the E2E workflow'],
  195 |       requirements: ['Understand test flows'],
```