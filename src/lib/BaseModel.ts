/**
 * BaseModel - نموذج أساسي للبيانات
 * يعمل مثل BaseModel في Dart
 */
export class BaseModel {
  private _data: Map<string, any> = new Map();

  constructor(data?: Map<string, any> | Record<string, any>) {
    if (data) {
      if (data instanceof Map) {
        data.forEach((value, key) => {
          this._data.set(key, value);
        });
      } else {
        Object.entries(data).forEach(([key, value]) => {
          this._data.set(key, value);
        });
      }
    }
  }

  remove(key: string): void {
    if (this._data.has(key)) {
      this._data.delete(key);
    }
  }

  put(key: string, value: any): void {
    this._data.set(key, value);
  }

  get(key: string): string {
    if (!this._data.has(key)) {
      return "";
    }
    const value = this._data.get(key);
    if (value === null || value === undefined) {
      return "";
    }
    return value.toString() === "null" ? "" : value.toString();
  }

  getData(): Record<string, any> {
    const result: Record<string, any> = {};
    this._data.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  getValue<T>(key: string): T | null {
    return (this._data.get(key) as T) || null;
  }

  containsKey(key: string): boolean {
    return this._data.has(key);
  }

  /**
   * حفظ البيانات مباشرة
   */
  async save(): Promise<void> {
    if (!this._data.has('id') || !this.get('id')) {
      throw new Error('يجب تحديد معرف (id) قبل الحفظ');
    }
    // سيتم تنفيذه في النماذج المحددة
  }

  /**
   * تحديث البيانات
   */
  async update(): Promise<void> {
    if (!this._data.has('id') || !this.get('id')) {
      throw new Error('يجب تحديد معرف (id) قبل التحديث');
    }
    // سيتم تنفيذه في النماذج المحددة
  }

  /**
   * حذف البيانات
   */
  async delete(): Promise<void> {
    if (!this._data.has('id') || !this.get('id')) {
      throw new Error('يجب تحديد معرف (id) قبل الحذف');
    }
    // سيتم تنفيذه في النماذج المحددة
  }

  /**
   * تحويل Timestamps من Firestore إلى strings
   */
  private static convertFirestoreTimestamps(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => BaseModel.convertFirestoreTimestamps(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        // Firestore Timestamp
        const timestamp = value as { seconds: number; nanoseconds: number };
        converted[key] = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toISOString();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively convert nested objects
        converted[key] = BaseModel.convertFirestoreTimestamps(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  /**
   * تحويل من Firestore DocumentSnapshot
   */
  static fromFirestore(doc: any): BaseModel {
    const data = doc.data();
    const convertedData = BaseModel.convertFirestoreTimestamps(data);
    const model = new BaseModel(convertedData);
    model.put('id', doc.id);
    return model;
  }

  /**
   * تحويل من Array of Firestore Documents
   */
  static fromFirestoreArray(docs: any[]): BaseModel[] {
    return docs.map(doc => BaseModel.fromFirestore(doc));
  }
}

