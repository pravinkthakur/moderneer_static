
import { createLocalStoragePort } from './state/storage_port.js';
import { Store } from './store/store.js';
import { EventBus } from './ui/event-bus.js';
import { mergeIntoLegacy, getConfig } from './model/config.js';
import * as Report from './report/index.js';

/** @typedef {{ ready:boolean, config:any }} AppState */

const bus = new EventBus();
const store = new Store(/** @type {AppState} */({ ready:false, config:null }));

// Expose for legacy code that might look for globals
window.App = Object.assign(window.App||{}, { bus, store, Report, di:{ storage:createLocalStoragePort() } });

function boot(){
  // Merge config into legacy model
  const model = mergeIntoLegacy();
  const cfg = getConfig();
  store.update(_=>({ ready:true, config: cfg }));
  bus.emit('config:ready', cfg);

  // If legacy render/compute exist, no-op. We expose events for future use.
  // Example: bus.on('compute:after', r=>{ /* analytics hook */ });
}

// Run after DOM and after legacy scripts have executed
if(document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', boot, { once:true });
} else {
  setTimeout(boot, 0);
}
