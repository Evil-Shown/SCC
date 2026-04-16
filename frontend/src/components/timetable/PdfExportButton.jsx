import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function minutesToLabel(m) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

const dayNames = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun"
};

export default function PdfExportButton({ timetable, slots = [] }) {
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const title = "Semester Timetable";
    const subtitle = timetable
      ? `Year ${timetable.year}  |  Semester ${timetable.semester}  |  ${timetable.batchType}`
      : "Academic schedule";
    const generatedAt = new Date().toLocaleString();

    const rows = slots
      .slice()
      .sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || (a.startMinute - b.startMinute))
      .map((s) => {
        const start = minutesToLabel(Number(s.startMinute) || 0);
        const end = minutesToLabel((Number(s.startMinute) || 0) + (Number(s.durationMinutes) || 0));
        const d = dayNames[Number(s.dayOfWeek)] || String(s.dayOfWeek);
        const code = s?.labelSnapshot?.moduleCode || "";
        const name = s?.labelSnapshot?.moduleName || "";
        const type = s?.labelSnapshot?.sessionType || "";
        const room = s?.labelSnapshot?.resourceName || "";
        const loc = s?.labelSnapshot?.resourceLocation || "";
        return [d, `${start} - ${end}`, code, name, type, room, loc];
      });

    const uniqueModules = new Set(
      slots.map((s) => s?.labelSnapshot?.moduleCode || s?.labelSnapshot?.moduleName).filter(Boolean)
    ).size;
    const uniqueRooms = new Set(
      slots.map((s) => s?.labelSnapshot?.resourceName).filter(Boolean)
    ).size;

    // Header block
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 76, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, 40, 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(subtitle, 40, 63);
    doc.text(`Generated: ${generatedAt}`, doc.internal.pageSize.getWidth() - 220, 63);

    // Summary strip
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(
      `Total Sessions: ${slots.length}   |   Modules: ${uniqueModules}   |   Rooms: ${uniqueRooms}`,
      40,
      94
    );

    autoTable(doc, {
      startY: 106,
      head: [["Day", "Time", "Code", "Module", "Type", "Room", "Location"]],
      body: rows,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: "linebreak",
        lineColor: [226, 232, 240],
        lineWidth: 0.6,
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [248, 250, 252],
        fontStyle: "bold",
        halign: "center"
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { valign: "middle" },
      columnStyles: {
        0: { cellWidth: 56, halign: "center" },
        1: { cellWidth: 86, halign: "center" },
        2: { cellWidth: 78, halign: "center" },
        3: { cellWidth: 190 },
        4: { cellWidth: 72, halign: "center" },
        5: { cellWidth: 110 },
        6: { cellWidth: 150 }
      },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        const current = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Page ${current} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 90,
          doc.internal.pageSize.getHeight() - 16
        );
      }
    });

    const fileName = timetable
      ? `timetable_y${timetable.year}_s${timetable.semester}_${timetable.batchType}.pdf`
      : "timetable.pdf";
    doc.save(fileName);
  };

  return (
    <button className="tt-btn tt-btn-outline" onClick={exportPdf} type="button">
      Export PDF
    </button>
  );
}

