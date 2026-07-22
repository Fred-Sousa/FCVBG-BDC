/* Gestion du tableau d'articles : ajout/suppression de lignes, remise, calculs de totaux par ligne, réinitialisation */

function confirmReset() {
    showConfirm("Voulez-vous vider entièrement le bon de commande ainsi que la sauvegarde locale ?", function() {
        localStorage.clear();
        document.getElementById('order-items-tbody').innerHTML = '';
        document.getElementById('customizations-container').innerHTML = '';
        
        document.getElementById('meta-order-id').value = "";
        document.getElementById('meta-order-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('meta-order-ref').value = "";
        document.getElementById('meta-order-email').value = "";
        document.getElementById('meta-order-type').value = "";
        document.getElementById('meta-order-details').value = "";

        updateGlobalDiscount(40);
        addBaseRow("JD9099", "U5", 1);
        addBaseRow("100522", "Général", 2);
        
        addCustomizationRow("Flocage Écusson FCVBG", 2.75, 0);
        calculateGrandTotal();
    });
}

function addBaseRow(defaultRef, defaultCat, defaultQty) {
    addCustomRow();
    const lastRow = document.getElementById(`row-${rowCount}`);
    lastRow.querySelector('.row-ref').value = defaultRef;
    lastRow.querySelector('select').value = defaultCat;
    lastRow.querySelector('.row-qty').value = defaultQty;
    checkReference(lastRow.querySelector('.row-ref'), lastRow.id);
}

function checkReference(inputElement, rowId) {
    const ref = inputElement.value.trim().toUpperCase();
    const row = document.getElementById(rowId);
    const imgElement = row.querySelector('.product-img');
    if (catalogDatabase[ref]) {
        row.querySelector('.row-designation').value = catalogDatabase[ref].designation;
        row.querySelector('.row-pvc-custom').value = catalogDatabase[ref].pvc.toFixed(2);
        imgElement.src = catalogDatabase[ref].img;
    }
    calculateRowTotal(row);
}

function updateGlobalDiscount(val) {
    document.getElementById('global-discount').value = val;
    document.getElementById('global-discount-slider').value = val;
    document.querySelectorAll('.row-discount').forEach(input => {
        input.value = val;
        calculateRowTotal(input.closest('tr'));
    });
}

function addCustomRow(savedData = null) {
    rowCount++;
    const tbody = document.getElementById('order-items-tbody');
    const row = document.createElement('tr');
    row.id = `row-${rowCount}`;
    row.className = 'hover:bg-slate-50/80 transition';

    const currentDiscount = document.getElementById('global-discount').value || "40";

    row.innerHTML = `
        <td data-label="Supprimer" class="py-2 px-1 text-center no-print"><button onclick="deleteRow('${row.id}')" class="text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash-can text-base"></i></button></td>
        <td data-label="Visuel" class="py-2 px-1 text-center flex flex-col items-center justify-center gap-1">
            <div class="product-img-container h-10 w-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 lg:mx-auto cursor-zoom-in" onclick="zoomImage('img-view-${row.id}')">
                <img id="img-view-${row.id}" src='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f1f5f9" rx="8"/><path d="M25,34 L38,20 L44,24 Q50,27 56,24 L62,20 L75,34 L66,42 L62,38 L62,82 L38,82 L38,38 L34,42 Z" fill="%23cbd5e1" stroke="%2394a3b8" stroke-width="2"/><circle cx="72" cy="76" r="10" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="2"/><path d="M65,76 L79,76 M72,69 L72,83" stroke="%2394a3b8" stroke-width="1.5"/></svg>' class="product-img w-full h-full object-contain bg-white">
            </div>
            <input type="file" id="file-img-${row.id}" accept="image/*" class="hidden" onchange="previewRowImage(this, '${row.id}')">
            <button onclick="triggerRowImage('${row.id}')" class="change-img-btn no-print text-[8px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-1 py-0.5 rounded font-bold">Modifier</button>
        </td>
        <td data-label="Catégorie" class="py-2 px-1 text-center">
            <select onchange="calculateRowTotal(this.closest('tr'))" class="row-cat w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 font-bold text-slate-800 text-center outline-none text-xs min-w-0">
                <option value="U5">U5</option><option value="U7">U7</option><option value="U9">U9</option><option value="U11">U11</option><option value="U13">U13</option><option value="U15">U15</option><option value="U17">U17</option><option value="U19">U19</option><option value="Seniors">Seniors</option><option value="Féminines">Féminines</option><option value="Staff">Staff</option><option value="Général">Général</option>
            </select>
        </td>
        <td data-label="Référence" class="py-2 px-1 text-center"><input type="text" oninput="checkReference(this, '${row.id}')" class="row-ref w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 font-black uppercase text-center outline-none text-[#163964] text-xs min-w-0"></td>
        <td data-label="Désignation" class="py-2 px-2 text-left mobile-full-width"><input type="text" oninput="saveAllData()" class="row-designation w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-900 outline-none text-xs min-w-0"></td>
        <td data-label="Prix PVC" class="py-2 px-1 text-center"><div class="flex items-center justify-center bg-slate-50 border border-slate-200 rounded px-1 mx-auto w-full max-w-[80px]"><input type="number" step="0.01" value="0.00" onchange="calculateRowTotal(this.closest('tr'))" class="row-pvc-custom w-full bg-transparent text-right font-semibold outline-none text-xs min-w-0"><span class="text-[10px] ml-0.5 text-slate-400">€</span></div></td>
        <td data-label="Remise" class="py-2 px-1 text-center"><div class="flex items-center justify-center bg-slate-50 border border-slate-200 rounded px-1 mx-auto w-full max-w-[65px]"><input type="number" value="${currentDiscount}" onchange="calculateRowTotal(this.closest('tr'))" class="row-discount w-full bg-transparent text-center font-black text-[#163964] outline-none text-xs min-w-0"><span class="text-xs ml-0.5 font-bold text-[#163964]">%</span></div></td>
        <td data-label="Prix Net Club" class="py-2 px-1 text-center font-black text-[#163964] row-net text-xs" data-value="0">0,00 €</td>
        <td data-label="Tailles" class="py-2 px-1 text-center"><input type="text" oninput="saveAllData()" class="row-sizes w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 text-center outline-none text-xs min-w-0"></td>
        <td data-label="Quantité" class="py-2 px-1 text-center"><input type="number" min="0" value="1" onchange="calculateRowTotal(this.closest('tr'))" class="row-qty w-full bg-slate-50 border border-slate-200 rounded text-center py-1 font-black mx-auto text-xs min-w-0"></td>
        <td data-label="Total Net" class="py-2 px-1 text-right font-black text-slate-800 row-total text-xs" data-value="0">0,00 €</td>
    `;
    tbody.appendChild(row);

    if(savedData) {
        row.querySelector('.row-cat').value = savedData.cat;
        row.querySelector('.row-ref').value = savedData.ref;
        row.querySelector('.row-designation').value = savedData.designation;
        row.querySelector('.row-pvc-custom').value = savedData.pvc;
        row.querySelector('.row-discount').value = savedData.discount;
        row.querySelector('.row-sizes').value = savedData.sizes;
        row.querySelector('.row-qty').value = savedData.qty;
        if(savedData.imgSrc) {
            row.querySelector('.product-img').src = savedData.imgSrc;
        } else {
            checkReference(row.querySelector('.row-ref'), row.id);
        }
    }
    calculateRowTotal(row);
}

function deleteRow(rowId) {
    const row = document.getElementById(rowId);
    if(row) { row.remove(); calculateGrandTotal(); saveAllData(); }
}

function calculateRowTotal(row) {
    const pvc = parseFloat(row.querySelector('.row-pvc-custom').value) || 0;
    const discount = parseFloat(row.querySelector('.row-discount').value) || 0;
    const qty = parseInt(row.querySelector('.row-qty').value) || 0;
    const netUnit = pvc * (1 - (discount / 100));
    const totalNet = netUnit * qty;
    row.querySelector('.row-net').innerText = netUnit.toFixed(2) + " €";
    row.querySelector('.row-net').setAttribute('data-value', netUnit);
    row.querySelector('.row-total').innerText = totalNet.toFixed(2) + " €";
    row.querySelector('.row-total').setAttribute('data-value', totalNet);
    calculateGrandTotal();
    saveAllData();
}

function calculateGrandTotal() {
    let totalPublic = 0, totalNetClub = 0;
    document.querySelectorAll('#order-items-tbody tr').forEach(row => {
        const pvc = parseFloat(row.querySelector('.row-pvc-custom').value) || 0;
        const qty = parseInt(row.querySelector('.row-qty').value) || 0;
        totalPublic += (pvc * qty);
        totalNetClub += parseFloat(row.querySelector('.row-total').getAttribute('data-value')) || 0;
    });
    
    let totalFlocage = 0;
    document.querySelectorAll('.customization-row').forEach(row => {
        const priceCust = parseFloat(row.querySelector('.cust-price').value) || 0;
        const qtyCust = parseInt(row.querySelector('.cust-qty').value) || 0;
        totalFlocage += (priceCust * qtyCust);
    });

    const grandTotalFinal = totalNetClub + totalFlocage;

    document.getElementById('subtotal-public').innerText = totalPublic.toFixed(2) + " €";
    document.getElementById('total-savings').innerText = "- " + (totalPublic - totalNetClub).toFixed(2) + " €";
    document.getElementById('grand-total').innerText = grandTotalFinal.toFixed(2) + " €";
}
