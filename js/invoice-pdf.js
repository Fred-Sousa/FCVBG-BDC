/* Génération de la facture PDF (jsPDF + AutoTable) */

function generateInvoicePDF() {
    if (typeof jspdf === 'undefined') {
        showAlert("Erreur", "La bibliothèque de génération PDF n'a pas pu être chargée (vérifiez la connexion internet).", "error");
        return;
    }

    // Récupère les lignes d'articles avec quantité > 0
    const itemRows = [];
    document.querySelectorAll('#order-items-tbody tr').forEach(tr => {
        const qty = parseInt(tr.querySelector('.row-qty').value) || 0;
        if (qty > 0) {
            itemRows.push({
                cat: tr.querySelector('.row-cat').value,
                ref: tr.querySelector('.row-ref').value || '-',
                designation: tr.querySelector('.row-designation').value || 'Article sans nom',
                sizes: tr.querySelector('.row-sizes').value || '-',
                qty: qty,
                netUnit: parseFloat(tr.querySelector('.row-net').getAttribute('data-value')) || 0,
                totalNet: parseFloat(tr.querySelector('.row-total').getAttribute('data-value')) || 0
            });
        }
    });

    if (itemRows.length === 0) {
        showAlert("Tableau vide", "Ajoutez au moins un article avec une quantité supérieure à 0 pour générer une facture.", "error");
        return;
    }

    // Recalcule les totaux à partir des données (indépendamment de l'affichage écran)
    let totalPublic = 0, totalNetClub = 0;
    document.querySelectorAll('#order-items-tbody tr').forEach(row => {
        const pvc = parseFloat(row.querySelector('.row-pvc-custom').value) || 0;
        const qty = parseInt(row.querySelector('.row-qty').value) || 0;
        totalPublic += (pvc * qty);
        totalNetClub += parseFloat(row.querySelector('.row-total').getAttribute('data-value')) || 0;
    });

    const flocRows = [];
    let totalFlocage = 0;
    document.querySelectorAll('.customization-row').forEach(row => {
        const desc = row.querySelectorAll('input')[0].value;
        const price = parseFloat(row.querySelector('.cust-price').value) || 0;
        const qty = parseInt(row.querySelector('.cust-qty').value) || 0;
        if (qty > 0) {
            flocRows.push([desc, fmtEUR(price), qty, fmtEUR(price * qty)]);
            totalFlocage += (price * qty);
        }
    });

    const grandTotal = totalNetClub + totalFlocage;
    const economie = totalPublic - totalNetClub;

    const orderId = document.getElementById('meta-order-id').value.trim();
    const dateVal = document.getElementById('meta-order-date').value;
    const dateFormatted = dateVal ? new Date(dateVal + 'T00:00:00').toLocaleDateString('fr-FR') : '—';
    const referent = document.getElementById('meta-order-ref').value.trim() || '—';
    const email = document.getElementById('meta-order-email').value.trim() || '—';
    const type = document.getElementById('meta-order-type').value.trim() || '—';
    const details = document.getElementById('meta-order-details').value.trim();

    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primary = [22, 57, 100];   // #163964
    const accent = [252, 227, 0];    // #fce300

    // --- En-tête ---
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('FACTURE', 14, 17);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('FC Villard-Bonnot', 196, 11, { align: 'right' });
    doc.text('Catalogues Intersport 2026/2027', 196, 17, { align: 'right' });
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 26, 210, 1.5, 'F');

    // --- Détails commande ---
    doc.setTextColor(40, 40, 40);
    let y = 38;
    doc.setFontSize(10);

    const infoLine = (label, value, x) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, x, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, x + 28, y);
    };

    infoLine('N° Commande :', orderId || '—', 14);
    infoLine('Date :', dateFormatted, 120);
    y += 6;
    infoLine('Référent :', referent, 14);
    infoLine('Type :', type, 120);
    y += 6;
    infoLine('E-mail :', email, 14);
    y += 6;

    if (details) {
        doc.setFont('helvetica', 'bold');
        doc.text('Détails :', 14, y);
        doc.setFont('helvetica', 'normal');
        const detailLines = doc.splitTextToSize(details, 150);
        doc.text(detailLines, 42, y);
        y += detailLines.length * 5;
    }

    y += 4;

    // --- Tableau des articles ---
    doc.autoTable({
        startY: y,
        head: [['Catégorie', 'Référence', 'Désignation', 'Tailles', 'Qté', 'Prix Net', 'Total Net']],
        body: itemRows.map(i => [i.cat, i.ref, i.designation, i.sizes, i.qty, fmtEUR(i.netUnit), fmtEUR(i.totalNet)]),
        theme: 'grid',
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
        columnStyles: {
            2: { cellWidth: 50 },
            4: { halign: 'center' },
            5: { halign: 'right' },
            6: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;

    // --- Tableau des flocages (si présents) ---
    if (flocRows.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.text('Flocages / Marquages', 14, y);
        y += 3;

        doc.autoTable({
            startY: y,
            head: [['Description', 'Prix unitaire', 'Qté', 'Total']],
            body: flocRows,
            theme: 'grid',
            headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'center' },
                3: { halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        y = doc.lastAutoTable.finalY + 8;
    }

    // Nouvelle page si pas assez de place pour les totaux
    if (y > 260) {
        doc.addPage();
        y = 20;
    }

    // --- Totaux ---
    const totalsLabelX = 130;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text('Total Tarif PVC :', totalsLabelX, y);
    doc.text(fmtEUR(totalPublic), 196, y, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Économie Club :', totalsLabelX, y);
    doc.text('- ' + fmtEUR(economie), 196, y, { align: 'right' });

    y += 9;
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(totalsLabelX - 4, y - 5.5, 70, 9, 'F');
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(12);
    doc.text('NET À PAYER :', totalsLabelX, y + 0.5);
    doc.text(fmtEUR(grandTotal), 196, y + 0.5, { align: 'right' });

    // --- Pied de page ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text("Document généré automatiquement depuis l'espace commande FCVBG - " + new Date().toLocaleDateString('fr-FR'), 14, 287);

    const safeId = orderId ? orderId.replace(/[^a-zA-Z0-9\-]/g, '_') : 'brouillon';
    doc.save(`Facture_FCVBG_${safeId}.pdf`);
}

function fmtEUR(n) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
