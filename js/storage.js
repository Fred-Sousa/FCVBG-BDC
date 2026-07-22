/* Sauvegarde et rechargement des données de la commande dans le localStorage du navigateur */

function saveAllData() {
    const rows = [];
    document.querySelectorAll('#order-items-tbody tr').forEach(tr => {
        rows.push({
            cat: tr.querySelector('.row-cat').value,
            ref: tr.querySelector('.row-ref').value,
            designation: tr.querySelector('.row-designation').value,
            pvc: tr.querySelector('.row-pvc-custom').value,
            discount: tr.querySelector('.row-discount').value,
            sizes: tr.querySelector('.row-sizes').value,
            qty: tr.querySelector('.row-qty').value,
            imgSrc: tr.querySelector('.product-img').src
        });
    });
    localStorage.setItem('fcvbg_order_rows', JSON.stringify(rows));
    localStorage.setItem('fcvbg_discount', document.getElementById('global-discount').value);

    const flocages = [];
    document.querySelectorAll('.customization-row').forEach(row => {
        flocages.push({
            desc: row.querySelectorAll('input')[0].value,
            price: row.querySelector('.cust-price').value,
            qty: row.querySelector('.cust-qty').value
        });
    });
    localStorage.setItem('fcvbg_flocages_data', JSON.stringify(flocages));

    localStorage.setItem('fcvbg_meta_id', document.getElementById('meta-order-id').value);
    localStorage.setItem('fcvbg_meta_date', document.getElementById('meta-order-date').value);
    localStorage.setItem('fcvbg_meta_ref', document.getElementById('meta-order-ref').value);
    localStorage.setItem('fcvbg_meta_email', document.getElementById('meta-order-email').value);
    localStorage.setItem('fcvbg_meta_type', document.getElementById('meta-order-type').value);
    localStorage.setItem('fcvbg_meta_details', document.getElementById('meta-order-details').value);
}

function loadAllData() {
    const rows = JSON.parse(localStorage.getItem('fcvbg_order_rows')) || [];
    const discount = localStorage.getItem('fcvbg_discount') || "40";
    
    updateGlobalDiscount(discount);
    
    document.getElementById('order-items-tbody').innerHTML = '';
    rows.forEach(rowData => addCustomRow(rowData));

    const container = document.getElementById('customizations-container');
    container.innerHTML = '';
    const flocages = JSON.parse(localStorage.getItem('fcvbg_flocages_data')) || [];
    if (flocages.length > 0) {
        flocages.forEach(floc => {
            addCustomizationRow(floc.desc, parseFloat(floc.price), parseInt(floc.qty));
        });
    } else {
        addCustomizationRow("Flocage Écusson FCVBG", 2.75, 0);
    }

    document.getElementById('meta-order-id').value = localStorage.getItem('fcvbg_meta_id') || "";
    if (localStorage.getItem('fcvbg_meta_date')) {
        document.getElementById('meta-order-date').value = localStorage.getItem('fcvbg_meta_date');
    }
    document.getElementById('meta-order-ref').value = localStorage.getItem('fcvbg_meta_ref') || "";
    document.getElementById('meta-order-email').value = localStorage.getItem('fcvbg_meta_email') || "";
    document.getElementById('meta-order-type').value = localStorage.getItem('fcvbg_meta_type') || "";
    document.getElementById('meta-order-details').value = localStorage.getItem('fcvbg_meta_details') || "";
    
    calculateGrandTotal();
}
