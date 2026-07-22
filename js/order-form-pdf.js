/* Génération du PDF du Bon de Commande (jsPDF + AutoTable) + page annexe photos */

/* Coordonnées de la structure (raison sociale) reprises du footer du site */
const CLUB_INFO = {
    name: 'FC Villard-Bonnot',
    emails: ['shop@fcvbg.fr', 'frederic.sousa@fcvbg.fr'],
    address: '48 Bd de la Libération, 38190 Villard-Bonnot'
};

/**
 * Prépare le logo du club (intégré en dur, cf. club-logo.js) pour l'inscrire,
 * ratio préservé, dans un carré de côté maxSize (mm). Pas de fichier externe à
 * charger, donc aucun souci possible en local (file://) ou avec un pare-feu.
 */
function prepareLogo(maxSize) {
    return new Promise((resolve) => {
        if (typeof CLUB_LOGO_DATA_URI === 'undefined') {
            console.warn('Bon de Commande PDF : club-logo.js non chargé, logo ignoré.');
            resolve(null);
            return;
        }
        const img = new Image();
        img.onload = () => {
            const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight);
            resolve({
                dataUrl: CLUB_LOGO_DATA_URI,
                w: img.naturalWidth * ratio,
                h: img.naturalHeight * ratio
            });
        };
        img.onerror = () => resolve(null);
        img.src = CLUB_LOGO_DATA_URI;
    });
}

/**
 * Charge une image (data URI SVG ou photo base64) et la rastérise sur un canvas carré,
 * façon "object-contain" (fond blanc, image centrée, ratio préservé).
 * Nécessaire car jsPDF.addImage ne sait pas lire du SVG directement.
 * Utilisé uniquement pour les visuels d'articles (toujours des data URI internes,
 * jamais de fichier externe, donc jamais concernés par le "Tainted canvas").
 */
function rasterizeImage(src, size = 400) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            const nw = img.naturalWidth || size;
            const nh = img.naturalHeight || size;
            const ratio = Math.min(size / nw, size / nh);
            const w = nw * ratio;
            const h = nh * ratio;
            ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            console.warn(`Bon de Commande PDF : impossible de charger l'image "${src}" (fichier absent, mal nommé, ou chemin incorrect).`);
            resolve(null);
        };
        img.src = src;
    });
}

async function generateOrderFormPDF() {
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
                pvc: parseFloat(tr.querySelector('.row-pvc-custom').value) || 0,
                discount: parseFloat(tr.querySelector('.row-discount').value) || 0,
                qty: qty,
                netUnit: parseFloat(tr.querySelector('.row-net').getAttribute('data-value')) || 0,
                totalNet: parseFloat(tr.querySelector('.row-total').getAttribute('data-value')) || 0,
                imgSrc: tr.querySelector('.product-img').src
            });
        }
    });

    if (itemRows.length === 0) {
        showAlert("Tableau vide", "Ajoutez au moins un article avec une quantité supérieure à 0 pour générer le bon de commande.", "error");
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

    // Pré-rastérise chaque visuel unique (évite de refaire le travail si la même image sert 2 fois)
    const imageCache = {};
    for (const item of itemRows) {
        if (!(item.imgSrc in imageCache)) {
            imageCache[item.imgSrc] = await rasterizeImage(item.imgSrc, 400);
        }
    }

    // Logo du club (intégré en dur, cf. club-logo.js)
    const logo = await prepareLogo(13);

    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primary = [22, 57, 100];   // #163964
    const accent = [252, 227, 0];    // #fce300
    const pageW = 210;
    const rightEdge = pageW - 14;

    // --- En-tête ---
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageW, 24, 'F');

    // Logo directement sur le bandeau bleu, sans fond (transparence PNG conservée)
    let titleX = 14;
    if (logo) {
        const logoSize = 16;
        const logoX = 14, logoY = 4;
        const imgX = logoX + (logoSize - logo.w) / 2;
        const imgY = logoY + (logoSize - logo.h) / 2;
        doc.addImage(logo.dataUrl, 'PNG', imgX, imgY, logo.w, logo.h);
        titleX = logoX + logoSize + 6;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.text('BON DE COMMANDE', titleX, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(CLUB_INFO.name, rightEdge, 14, { align: 'right' });
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 24, pageW, 1.5, 'F');

    // --- Détails commande ---
    doc.setTextColor(40, 40, 40);
    let y = 36;
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

    // --- Tableau des articles (mêmes colonnes que le tableau à l'écran) ---
    // Police resserrée pour faire tenir les 9 colonnes en portrait
    doc.autoTable({
        startY: y,
        head: [['Catégorie', 'Référence', 'Désignation', 'Tailles', 'PVC', 'Remise', 'Prix Net', 'Qté', 'Total Net']],
        body: itemRows.map(i => [
            i.cat, i.ref, i.designation, i.sizes,
            fmtEUR(i.pvc), i.discount.toFixed(0) + ' %', fmtEUR(i.netUnit), i.qty, fmtEUR(i.totalNet)
        ]),
        theme: 'grid',
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 7.5, cellPadding: 1.5 },
        bodyStyles: { fontSize: 7.5, textColor: [40, 40, 40], cellPadding: 1.5 },
        columnStyles: {
            0: { cellWidth: 16 },
            1: { cellWidth: 20 },
            2: { cellWidth: 46 },
            3: { cellWidth: 16 },
            4: { cellWidth: 19, halign: 'right' },
            5: { cellWidth: 15, halign: 'center' },
            6: { cellWidth: 19, halign: 'right' },
            7: { cellWidth: 10, halign: 'center' },
            8: { cellWidth: 21, halign: 'right' }
        },
        margin: { left: 14, right: 14, bottom: 22 }
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
            margin: { left: 14, right: 14, bottom: 22 }
        });

        y = doc.lastAutoTable.finalY + 8;
    }

    // Nouvelle page si pas assez de place pour les totaux
    if (y > 255) {
        doc.addPage('a4', 'portrait');
        y = 20;
    }

    // --- Totaux ---
    const totalsLabelX = 130;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    doc.text('Total Tarif PVC :', totalsLabelX, y);
    doc.text(fmtEUR(totalPublic), rightEdge, y, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('Économie Club :', totalsLabelX, y);
    doc.text('- ' + fmtEUR(economie), rightEdge, y, { align: 'right' });

    y += 9;
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(totalsLabelX - 4, y - 5.5, rightEdge - totalsLabelX + 4, 9, 'F');
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(12);
    doc.text('NET À FACTURER :', totalsLabelX, y + 0.5);
    doc.text(fmtEUR(grandTotal), rightEdge, y + 0.5, { align: 'right' });

    // --- Page annexe : photo agrandie + référence, pour identifier chaque ligne ---
    doc.addPage('a4', 'portrait');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text('Annexe — Visuels des articles', 14, 18);

    doc.autoTable({
        startY: 26,
        head: [['Photo', 'Référence']],
        body: itemRows.map(() => ['', '']),
        theme: 'grid',
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 10 },
        styles: { minCellHeight: 32, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 'auto', fontSize: 11 }
        },
        margin: { left: 14, right: 14, bottom: 22 },
        didDrawCell: (data) => {
            if (data.section !== 'body') return;
            const item = itemRows[data.row.index];
            if (!item) return;

            if (data.column.index === 0) {
                const pngData = imageCache[item.imgSrc];
                if (pngData) {
                    const pad = 3;
                    const box = Math.min(data.cell.width, data.cell.height) - pad * 2;
                    const x = data.cell.x + (data.cell.width - box) / 2;
                    const yImg = data.cell.y + (data.cell.height - box) / 2;
                    doc.addImage(pngData, 'PNG', x, yImg, box, box);
                }
            } else if (data.column.index === 1) {
                const cx = data.cell.x + 4;
                const cyRef = data.cell.y + data.cell.height / 2 - 2;
                const cyDes = data.cell.y + data.cell.height / 2 + 4;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(primary[0], primary[1], primary[2]);
                doc.text(item.ref, cx, cyRef);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(90, 90, 90);
                doc.text(item.designation, cx, cyDes);
            }
        }
    });

    // --- Pied de page (raison sociale) sur toutes les pages ---
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(210, 210, 210);
        doc.line(14, 280, rightEdge, 280);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(
            `${CLUB_INFO.name}  •  ${CLUB_INFO.emails.join(' / ')}  •  ${CLUB_INFO.address}`,
            pageW / 2, 284.5, { align: 'center' }
        );
        doc.setFontSize(7);
        doc.text(`Page ${p} / ${totalPages}`, rightEdge, 284.5, { align: 'right' });
    }

    const safeId = orderId ? orderId.replace(/[^a-zA-Z0-9\-]/g, '_') : 'brouillon';
    doc.save(`BonDeCommande_FCVBG_${safeId}.pdf`);
}

function fmtEUR(n) {
    const fixed = (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
    const isNegative = fixed.startsWith('-');
    const [intPart, decPart] = (isNegative ? fixed.slice(1) : fixed).split('.');
    // Espace normal (et non l'espace fine insécable de toLocaleString, non supportée par les polices de base de jsPDF)
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (isNegative ? '-' : '') + grouped + ',' + decPart + ' €';
}
