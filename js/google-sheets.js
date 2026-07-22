/* Connexion à Google Sheets (URL Apps Script) et transmission du bon de commande */

function saveEndpointUrl() {
    const url = document.getElementById('sheets-endpoint-url').value.trim();
    localStorage.setItem('fcvbg_sheets_url', url);
}

function toggleUrlVisibility() {
    const input = document.getElementById('sheets-endpoint-url');
    const icon = document.getElementById('url-vis-icon');
    if (input.type === "password") {
        input.type = "text";
        icon.className = "fa-solid fa-eye-slash";
    } else {
        input.type = "password";
        icon.className = "fa-solid fa-eye";
    }
}

function submitToGoogleSheets() {
    const url = document.getElementById('sheets-endpoint-url').value.trim();
    if (!url) {
        showAlert("Erreur de liaison", "Veuillez coller l'URL de votre application Web Google Apps Script dans le volet de configuration situé tout en haut.", "error");
        return;
    }

    const orderId = document.getElementById('meta-order-id').value.trim();
    const date = document.getElementById('meta-order-date').value;
    const referent = document.getElementById('meta-order-ref').value.trim();
    const email = document.getElementById('meta-order-email').value.trim();
    const type = document.getElementById('meta-order-type').value.trim();
    const details = document.getElementById('meta-order-details').value.trim();

    if (!orderId || !referent || !email) {
        showAlert("Informations manquantes", "Pour enregistrer une commande officielle, veuillez obligatoirement remplir le 'N° Commande', le 'Nom Référent' et l' 'E-mail Référent'.", "error");
        return;
    }

    const items = [];
    document.querySelectorAll('#order-items-tbody tr').forEach(tr => {
        const qty = parseInt(tr.querySelector('.row-qty').value) || 0;
        if(qty > 0) {
            items.push({
                cat: tr.querySelector('.row-cat').value,
                ref: tr.querySelector('.row-ref').value || "-",
                designation: tr.querySelector('.row-designation').value || "Article sans nom",
                pvc: parseFloat(tr.querySelector('.row-pvc-custom').value) || 0,
                discount: parseFloat(tr.querySelector('.row-discount').value) || 0,
                netUnit: parseFloat(tr.querySelector('.row-net').getAttribute('data-value')) || 0,
                sizes: tr.querySelector('.row-sizes').value || "-",
                qty: qty,
                totalNet: parseFloat(tr.querySelector('.row-total').getAttribute('data-value')) || 0
            });
        }
    });

    if (items.length === 0) {
        showAlert("Tableau vide", "Ajoutez au moins un article avec une quantité supérieure à 0 pour valider.", "error");
        return;
    }

    const flocages = [];
    document.querySelectorAll('.customization-row').forEach(row => {
        flocages.push({
            desc: row.querySelectorAll('input')[0].value,
            price: parseFloat(row.querySelector('.cust-price').value) || 0,
            qty: parseInt(row.querySelector('.cust-qty').value) || 0
        });
    });

    const grandTotal = parseFloat(document.getElementById('grand-total').innerText.replace(' €', '').replace(',', '.'));

    const payload = {
        orderId: orderId,
        date: date,
        referent: referent,
        email: email,
        type: type,
        details: details,
        items: items,
        flocages: flocages,
        grandTotal: grandTotal
    };

    showAlert("Transmission...", "Envoi en cours des données vers Google Drive, veuillez patienter...", "info");

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        showAlert("Félicitations ! 🎉", "Votre bon de commande a bien été transmis et enregistré. Un e-mail de confirmation a été envoyé à " + email + ".", "success");
    })
    .catch(error => {
        showAlert("Erreur de connexion", "Impossible de joindre le serveur Google. Détails : " + error.toString(), "error");
    });
}
