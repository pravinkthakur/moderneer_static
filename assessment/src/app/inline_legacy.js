/* extracted */
document.addEventListener("click", function(e){
  const btn = e.target.closest && e.target.closest("#btnCopyAnalyst");
  if(!btn) return;
  const targetId = btn.getAttribute("data-target");
  const pane = document.getElementById(targetId);
  if(!pane) return;
  const t = document.createElement("textarea");
  t.value = pane.innerText; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
  btn.textContent = "Copied"; setTimeout(()=> btn.textContent = "Copy analyst lens", 1200);
});
