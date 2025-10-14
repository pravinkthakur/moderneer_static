// src/components/Modal.js
import { h, qs } from "./dom.js";

export function openModal(title, bodyEl){
  const overlay = qs("#overlay");
  const modalTitle = qs("#modalTitle");
  const modalContent = qs("#modalContent");
  if(!overlay || !modalTitle || !modalContent) return;
  modalTitle.textContent = title || "";
  modalContent.innerHTML = "";
  if(bodyEl) modalContent.appendChild(bodyEl);
  overlay.style.display = "flex";
  // focus the first button if present
  setTimeout(()=>{
    const firstBtn = modalContent.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if(firstBtn) firstBtn.focus();
  }, 0);
}

export function closeModal(){
  const overlay = qs("#overlay");
  if(overlay) overlay.style.display = "none";
}
