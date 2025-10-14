export function djb2(str){
  let h = 5381; let i = str.length;
  while(i) h = (h * 33) ^ str.charCodeAt(--i);
  return (h >>> 0).toString(16);
}
