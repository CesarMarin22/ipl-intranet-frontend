import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportComedorReportPdf({
  resumen,
  corteDiario,
  topConsumos,
  saldosBajos,
  formatMoney,
}: any) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte comedor IPL", 14, 15);

  doc.setFontSize(10);
  doc.text(`Fecha de generación: ${new Date().toLocaleString("es-MX")}`, 14, 22);

  autoTable(doc, {
    startY: 30,
    head: [["Concepto", "Valor"]],
    body: [
      ["Total recargado", formatMoney(resumen?.recargas?.MONTO_RECARGAS ?? 0)],
      ["Total consumido", formatMoney(resumen?.consumos?.MONTO_CONSUMOS ?? 0)],
      ["Total recargas", resumen?.recargas?.TOTAL_RECARGAS ?? 0],
      ["Total consumos", resumen?.consumos?.TOTAL_CONSUMOS ?? 0],
      ["Diferencia", formatMoney((resumen?.recargas?.MONTO_RECARGAS ?? 0) - (resumen?.consumos?.MONTO_CONSUMOS ?? 0))],
    ],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Corte diario", "Valor"]],
    body: [
      ["Fecha", corteDiario?.FECHA ?? "-"],
      ["Usuarios atendidos", corteDiario?.USUARIOS_ATENDIDOS ?? 0],
      ["Comidas recargadas", corteDiario?.COMIDAS_RECARGADAS ?? 0],
      ["Comidas consumidas", corteDiario?.COMIDAS_CONSUMIDAS ?? 0],
      ["Paquete más vendido", corteDiario?.PAQUETE_TOP ? `${corteDiario.PAQUETE_TOP} comidas` : "-"],
      ["Diferencia", formatMoney(corteDiario?.DIFERENCIA ?? 0)],
    ],
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Empleado", "No.", "Consumos", "Monto"]],
    body: topConsumos.map((r: any) => [
      r.NOMBRE,
      r.NUMERO_EMPLEADO ?? "-",
      r.TOTAL_CONSUMOS,
      formatMoney(r.MONTO),
    ]),
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Empleado", "No.", "Comidas", "Saldo"]],
    body: saldosBajos.map((r: any) => [
      r.NOMBRE,
      r.NUMERO_EMPLEADO ?? "-",
      r.COMIDAS_DISPONIBLES,
      formatMoney(r.SALDO),
    ]),
  });

  doc.save("reporte-comedor.pdf");
}