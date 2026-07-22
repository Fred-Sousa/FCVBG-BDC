/* Point d'entrée : initialisation au chargement de la page (window.onload) */

window.onload = function() {
    if (!localStorage.getItem('fcvbg_discount')) {
        localStorage.setItem('fcvbg_discount', '40');
    }

    const savedRows = localStorage.getItem('fcvbg_order_rows');
    if (savedRows && JSON.parse(savedRows).length > 0) {
        loadAllData();
    } else {
        addBaseRow("JD9099", "U5", 1);
        addBaseRow("100522", "Général", 2);
        
        addCustomizationRow("Flocage Écusson FCVBG", 2.75, 0);
        calculateGrandTotal();
    }
    
    const savedLogo = localStorage.getItem('fcvbg_custom_logo');
    if(savedLogo) {
        document.getElementById('main-logo-header').src = savedLogo;
        document.getElementById('main-logo-body').src = savedLogo;
    }

    if (!document.getElementById('meta-order-date').value) {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('meta-order-date').value = today;
    }

    const savedEndpoint = localStorage.getItem('fcvbg_sheets_url');
    if(savedEndpoint) {
        document.getElementById('sheets-endpoint-url').value = savedEndpoint;
    }
};
