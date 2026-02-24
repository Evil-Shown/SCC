import ExcelJS from "exceljs";

export const generateApplicantsExcel = async (applicants, kuppiDetails) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Applicants");
  
  worksheet.properties.defaultRowHeight = 20;
  
  worksheet.columns = [
    { header: "No.", key: "no", width: 8 },
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 35 },
    { header: "Student ID", key: "studentId", width: 15 },
    { header: "Department", key: "department", width: 20 },
    { header: "Year", key: "year", width: 10 },
    { header: "Applied At", key: "appliedAt", width: 20 }
  ];
  
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  
  applicants.forEach((applicant, index) => {
    worksheet.addRow({
      no: index + 1,
      name: applicant.name,
      email: applicant.email,
      studentId: applicant.applicantId?.studentId || "N/A",
      department: applicant.applicantId?.department || "N/A",
      year: applicant.applicantId?.year || "N/A",
      appliedAt: new Date(applicant.createdAt).toLocaleDateString()
    });
  });
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "middle", horizontal: "left" };
    }
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });
  
  worksheet.insertRow(1, []);
  worksheet.mergeCells("A1:G1");
  worksheet.getCell("A1").value = `Kuppi Session: ${kuppiDetails.title}`;
  worksheet.getCell("A1").font = { bold: true, size: 14 };
  worksheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 30;
  
  return workbook;
};

export default { generateApplicantsExcel };
