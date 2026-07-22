/* Upload et prévisualisation du logo du club (en-tête + bon de commande) */

function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('main-logo-header').src = e.target.result;
            document.getElementById('main-logo-body').src = e.target.result;
            localStorage.setItem('fcvbg_custom_logo', e.target.result);
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function triggerRowImage(rowId) {
    document.getElementById(`file-img-${rowId}`).click();
}

function previewRowImage(input, rowId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(`img-view-${rowId}`).src = e.target.result;
            saveAllData();
        }
        reader.readAsDataURL(input.files[0]);
    }
}
