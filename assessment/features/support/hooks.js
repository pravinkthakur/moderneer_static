
const { BeforeAll, AfterAll } = require('@cucumber/cucumber');
const { PlaywrightWorld } = require('./world');

let world;
BeforeAll(async function() {
  world = new PlaywrightWorld();
  this.world = world;
  await world.open();
});
AfterAll(async function() {
  await this.world.close();
});
