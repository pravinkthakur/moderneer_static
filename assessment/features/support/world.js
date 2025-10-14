
const { setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

class PlaywrightWorld {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }
  async open() {
    if (!this.browser) {
      this.browser = await chromium.launch();
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();
    }
    return this.page;
  }
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
setWorldConstructor(PlaywrightWorld);
setDefaultTimeout(60 * 1000);
module.exports = { PlaywrightWorld };
