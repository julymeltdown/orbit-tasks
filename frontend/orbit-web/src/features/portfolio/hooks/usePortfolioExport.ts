import { request } from "@/lib/http/client";

interface ReportResponse {
  portfolioId: string;
  month: string;
  headline: string;
  csv: string;
}

export function usePortfolioExport() {
  async function exportMonthly(portfolioId: string): Promise<string> {
    const report = await request<ReportResponse>(`/api/portfolio/monthly-report?portfolioId=${encodeURIComponent(portfolioId)}`);
    return report.csv;
  }

  return { exportMonthly };
}
