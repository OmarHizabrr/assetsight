import { PdfSettingsModel, defaultPdfSettings } from '@/lib/models/PdfSettingsModel';

const STORAGE_KEY = 'pdf_settings';

export class PdfSettingsService {
  private static instance: PdfSettingsService;
  private cachedSettings: PdfSettingsModel | null = null;

  private constructor() {}

  static getInstance(): PdfSettingsService {
    if (!PdfSettingsService.instance) {
      PdfSettingsService.instance = new PdfSettingsService();
    }
    return PdfSettingsService.instance;
  }

  /**
   * الحصول على الإعدادات المحفوظة
   */
  getSettings(): PdfSettingsModel {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    if (typeof window === 'undefined') {
      return defaultPdfSettings;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cachedSettings = { ...defaultPdfSettings, ...parsed } as PdfSettingsModel;
        return this.cachedSettings;
      }
    } catch (error) {
      console.error('Error loading PDF settings:', error);
    }

    this.cachedSettings = defaultPdfSettings;
    return this.cachedSettings;
  }

  /**
   * حفظ الإعدادات
   */
  saveSettings(settings: PdfSettingsModel): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      this.cachedSettings = settings;
      return true;
    } catch (error) {
      console.error('Error saving PDF settings:', error);
      return false;
    }
  }

  /**
   * استعادة الإعدادات الافتراضية
   */
  resetToDefault(): boolean {
    this.cachedSettings = null;
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting PDF settings:', error);
      return false;
    }
  }
}

