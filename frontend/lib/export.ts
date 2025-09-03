import type { GetReportsResponse } from '~backend/reports/get';

function convertToCSV(data: any[], headers: string[], keys: string[]): string {
  const headerRow = headers.join(',');
  const rows = data.map(row =>
    keys.map(key => JSON.stringify(row[key] || '', (_, value) => value === null ? '' : value)).join(',')
  );
  return [headerRow, ...rows].join('\n');
}

export function exportReportsToCSV(reports: GetReportsResponse, tenantName: string) {
  let csvContent = `Relatórios para ${tenantName}\n\n`;

  // Conversion by Channel
  csvContent += "Taxa de Conversão por Canal\n";
  csvContent += convertToCSV(reports.conversionByChannel, ['Canal', 'Conversões', 'Total de Leads'], ['label', 'value', 'total']);
  csvContent += "\n\n";

  // Consultant Ranking
  csvContent += "Ranking de Consultores (por matrículas)\n";
  csvContent += convertToCSV(reports.consultantRanking, ['Consultor', 'Matrículas'], ['label', 'value']);
  csvContent += "\n\n";

  // Enrollments by Discipline
  csvContent += "Matrículas por Disciplina\n";
  csvContent += convertToCSV(reports.enrollmentsByDiscipline, ['Disciplina', 'Matrículas'], ['label', 'value']);
  csvContent += "\n\n";

  // Average Funnel Time
  csvContent += "Tempo Médio do Funil\n";
  if (reports.averageFunnelTime) {
    const { days, hours, minutes } = reports.averageFunnelTime;
    csvContent += `Dias,Horas,Minutos\n`;
    csvContent += `${days},${hours},${minutes}\n`;
  } else {
    csvContent += "N/A\n";
  }

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorios_${tenantName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
