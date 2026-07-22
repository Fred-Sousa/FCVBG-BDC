/* Gestion des lignes de flocages / marquages personnalisés */

function addCustomizationRow(savedDesc = "Flocage Écusson FCVBG", savedPrice = 2.75, savedQty = 0) {
    custRowCount++;
    const container = document.getElementById('customizations-container');
    const row = document.createElement('div');
    row.id = `cust-row-${custRowCount}`;
    row.className = 'grid grid-cols-12 gap-2 items-center customization-row';
    row.innerHTML = `
        <input type="text" value="${savedDesc}" oninput="saveAllData()" class="col-span-6 bg-white border border-slate-200 rounded px-2 py-1.5 font-semibold text-slate-700 outline-none text-xs min-w-0">
        <div class="col-span-3 flex items-center bg-white border border-slate-200 rounded px-1 py-1.5">
            <input type="number" step="0.01" value="${savedPrice}" onchange="calculateGrandTotal(); saveAllData();" class="w-full text-right cust-price font-bold outline-none text-xs min-w-0">
            <span class="text-[10px] text-slate-400 ml-0.5">€</span>
        </div>
        <div class="col-span-2 flex items-center bg-white border border-slate-200 rounded px-1 py-1.5">
            <input type="number" value="${savedQty}" onchange="calculateGrandTotal(); saveAllData();" class="w-full text-center cust-qty font-bold outline-none text-xs min-w-0">
        </div>
        <button onclick="this.parentElement.remove(); calculateGrandTotal(); saveAllData();" class="col-span-1 text-slate-400 hover:text-red-500 text-center no-print">
            <i class="fa-solid fa-trash-can text-sm"></i>
        </button>
    `;
    container.appendChild(row);
    calculateGrandTotal();
    saveAllData();
}
