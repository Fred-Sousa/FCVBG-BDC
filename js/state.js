/* État global de l'application + base de données catalogue (références produits connues) */

let rowCount = 0;
let custRowCount = 0;
let onConfirmCallback = null;

const catalogDatabase = {
    "JD9099": { designation: "Maillot Entraînement Tiro BLEU - ADULTE", pvc: 25.00, img: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M25,32 L38,18 L44,22 Q50,25 56,22 L62,18 L75,32 L66,40 L62,36 L62,85 L38,85 L38,36 L34,40 Z" fill="%231d4ed8" stroke="%231e40af" stroke-width="1.5"/></svg>` },
    "100522": { designation: "Ballon de Match Uhlsport Elysia Pro T5", pvc: 34.99, img: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="white" stroke="%23cbd5e1" stroke-width="2"/></svg>` }
};
