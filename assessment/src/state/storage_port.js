
/**
 * Storage Port: runtime provides an implementation.
 * @typedef {{ save(key:string, value:any):void, load(key:string):any, keys():string[] }} StoragePort
 */

/**
 * LocalStorage implementation with JSON serialisation.
 * @returns {StoragePort}
 */
export function createLocalStoragePort(){
  return {
    save(key, value){
      localStorage.setItem(key, JSON.stringify(value));
    },
    load(key){
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : null;
    },
    keys(){
      return Object.keys(localStorage);
    }
  };
}
