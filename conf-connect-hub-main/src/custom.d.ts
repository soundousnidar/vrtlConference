import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }

  interface AutoTableOptions {
    head?: string[][];
    body?: any[][];
    startY?: number;
    // Ajoutez d'autres options si nécessaire
  }
}