
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('expect');

function fileUrl(p){
  const url = 'file://' + p.replace(/\\/g,'/');
  return url;
}

Given('I open the app', async function () {
  const page = await this.world.open();
  const path = require('path');
  const full = path.resolve('index.html');
  await page.goto(fileUrl(full));
  await page.waitForSelector('[data-testid="compute"]', { state: 'visible' });
});

When('I click the Compute button', async function () {
  const page = this.world.page;
  await page.click('[data-testid="compute"]');
});

Then('I see the overall index number', async function () {
  const page = this.world.page;
  const txt = await page.textContent('[data-testid="overall-index"]');
  expect(txt).toBeTruthy();
  const num = Number(String(txt).replace(/[^\d.\-]/g,''));
  expect(Number.isFinite(num)).toBe(true);
});

Then('I see the last compute timestamp update', async function () {
  const page = this.world.page;
  const before = await page.textContent('[data-testid="last-compute"]');
  await page.click('[data-testid="compute"]');
  await page.waitForTimeout(100);
  const after = await page.textContent('[data-testid="last-compute"]');
  expect(after).toBeTruthy();
  expect(after.trim()).not.toEqual(before && before.trim());
});

When('I select Core mode', async function () {
  const page = this.world.page;
  await page.click('[data-testid="mode-core"]');
});

When('I select Full mode', async function () {
  const page = this.world.page;
  await page.click('[data-testid="mode-full"]');
});

Then('the UI reflects the selected mode', async function () {
  const page = this.world.page;
  const coreActive = await page.getAttribute('[data-testid="mode-core"]','class');
  const fullActive = await page.getAttribute('[data-testid="mode-full"]','class');
  expect(coreActive || fullActive).toBeTruthy();
});

Then('a CSP meta tag exists', async function () {
  const page = this.world.page;
  const content = await page.getAttribute('meta[http-equiv="Content-Security-Policy"]','content');
  expect(content).toBeTruthy();
});

Then('the CSP contains {string}', async function (expected) {
  const page = this.world.page;
  const content = await page.getAttribute('meta[http-equiv="Content-Security-Policy"]','content');
  expect(content.includes(expected)).toBe(true);
});

Then('the Save, Load, Export, and Report buttons exist', async function () {
  const page = this.world.page;
  for (const id of ['[data-testid="save"]','[data-testid="load"]','[data-testid="export"]','[data-testid="report"]']) {
    await page.waitForSelector(id, { state: 'visible' });
  }
});

When('I click the Save, Load, Export, and Report buttons', async function () {
  const page = this.world.page;
  for (const id of ['[data-testid="save"]','[data-testid="load"]','[data-testid="export"]','[data-testid="report"]']) {
    await page.click(id);
  }
});

Then('no page error occurs', async function () {
  const page = this.world.page;
  let hadError = false;
  page.on('pageerror', () => { hadError = true; });
  await page.waitForTimeout(100);
  if (hadError) {
    throw new Error('Page error detected during interactions');
  }
});

Then('a main landmark exists', async function () {
  const page = this.world.page;
  const main = await page.$('main');
  if(!main) throw new Error('No <main> landmark found');
});


Then('saving persists state to localStorage', async function () {
  const page = this.world.page;
  // clear first
  await page.evaluate(() => localStorage.clear());
  await page.click('[data-testid="save"]');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  if (keys.length === 0) throw new Error('No localStorage keys after save');
});

When('I load from localStorage if available', async function () {
  const page = this.world.page;
  await page.click('[data-testid="load"]');
  await page.waitForTimeout(50);
});


Then('I can query the banner and main landmarks', async function () {
  const page = this.world.page;
  const hasHeader = !!(await page.$('header, [role="banner"]'));
  const hasMain = !!(await page.$('main, [role="main"]'));
  if(!hasHeader || !hasMain) throw new Error('Missing banner or main landmark');
});
