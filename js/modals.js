/* Système de modales personnalisées (alertes / confirmations) remplaçant alert() et confirm() natifs */

function showAlert(title, message, type = 'info') {
    const modal = document.getElementById('custom-alert-modal');
    const titleElem = document.getElementById('alert-title');
    const messageElem = document.getElementById('alert-message');
    const iconBg = document.getElementById('alert-icon-bg');
    const icon = document.getElementById('alert-icon');

    titleElem.innerText = title;
    messageElem.innerText = message;

    icon.className = "fa-solid";
    if(type === 'success') {
        iconBg.className = "p-3 bg-emerald-50 text-emerald-600 rounded-full shrink-0";
        icon.classList.add("fa-circle-check");
    } else if(type === 'error') {
        iconBg.className = "p-3 bg-rose-50 text-rose-600 rounded-full shrink-0";
        icon.classList.add("fa-circle-exclamation");
    } else {
        iconBg.className = "p-3 bg-blue-50 text-blue-600 rounded-full shrink-0";
        icon.classList.add("fa-circle-info");
    }

    modal.classList.remove('hidden');
}

function closeAlertModal() {
    document.getElementById('custom-alert-modal').classList.add('hidden');
}

function showConfirm(message, onYes) {
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('confirm-message').innerText = message;
    onConfirmCallback = onYes;
    modal.classList.remove('hidden');
}

function closeConfirmModal(confirmed) {
    document.getElementById('custom-confirm-modal').classList.add('hidden');
    if(confirmed && onConfirmCallback) {
        onConfirmCallback();
    }
    onConfirmCallback = null;
}

document.getElementById('confirm-btn-yes').addEventListener('click', function() {
    closeConfirmModal(true);
});

function zoomImage(imgId) {
    const sourceImg = document.getElementById(imgId);
    if (!sourceImg) return;
    document.getElementById('image-zoom-preview').src = sourceImg.src;
    document.getElementById('image-zoom-modal').classList.remove('hidden');
}

function closeImageZoom() {
    document.getElementById('image-zoom-modal').classList.add('hidden');
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageZoom();
    }
});
