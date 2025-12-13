export interface PdfSettingsModel {
  isHeaderVisible: boolean;
  logoBase64: string;
  rightHeader: string; // الرأس الأيمن (العربي)
  leftHeader: string; // الرأس الأيسر (English)
  footerText: string; // التذييل (التوقيعات)
}

export const defaultPdfSettings: PdfSettingsModel = {
  isHeaderVisible: true,
  logoBase64: '',
  rightHeader: 'نظام AssetSight\nإدارة الأصول والممتلكات',
  leftHeader: 'AssetSight System\nAssets Management',
  footerText: 'اسم الطالب\nالسجل\nمكان السجل\nالمشرف',
};

