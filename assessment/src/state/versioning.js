export const STATE_VERSION = 2;

export function migrateState(raw){
  if(!raw || typeof raw !== 'object') return { version: STATE_VERSION, data: {} };
  const v = Number(raw.version || 1);
  let cur = { version: v, data: raw.data || raw }; // tolerate old shape
  // v1 -> v2 example: ensure object per param indices structure
  if(cur.version < 2){
    // no-op placeholder; extend as needed
    cur.version = 2;
  }
  return cur;
}
