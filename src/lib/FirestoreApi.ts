import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type AggregateQuerySnapshot,
  type CollectionReference,
  type DocumentReference,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * تحويل Timestamp من Firestore إلى string ISO
 */
function convertTimestampToString(value: unknown): string {
  if (!value) {
    return new Date().toISOString();
  }
  
  if (typeof value === 'object' && value !== null && 'seconds' in value && 'nanoseconds' in value) {
    const timestamp = value as { seconds: number; nanoseconds: number };
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000).toISOString();
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return new Date().toISOString();
}

/**
 * FirestoreApi - واجهة برمجية لتفاعل مع Firestore
 * 
 * المنهجية:
 * - جميع عمليات الكتابة تمر عبر setData/updateData حصراً
 * - لا توجد try/catch داخل الدوال (الأخطاء تذهب للمستدعي)
 * - التعليقات باللغة العربية
 * - يستخدم المسارات البسيطة المباشرة
 * - كل وثيقة فرعية لابد أن تكون مثل اسم الوثيقة الرئيسية
 * 
 * أمثلة المسارات:
 * - departments/departmentId/
 * - departments/departmentId/departments/departmentId/departments/officeId/
 * - departments/departmentId/departments/departmentId/departments/cycleId/
 * - departments/departmentId/departments/cycleId/departments/cycleId/departments/inventoryItems/itemId/
 * - assets/assetId/
 * - assets/assetId/assets/assetId/assets/assetAttachments/attachmentId/
 * - assets/assetId/assets/assetId/assets/assetHistory/historyId/
 * - users/userId/ (جدول مستقل)
 */
export class FirestoreApi {
  // === Singleton ===
  private static _instance: FirestoreApi;
  
  static get Api(): FirestoreApi {
    if (!FirestoreApi._instance) {
      FirestoreApi._instance = new FirestoreApi();
    }
    return FirestoreApi._instance;
  }

  private constructor() {}

  // ==============================
  // دوال مرجعية بسيطة (مثل Firestore الرسمي)
  // ==============================

  /**
   * الحصول على معرف جديد من Firestore
   */
  getNewId(collectionName: string): string {
    return doc(collection(db, collectionName)).id;
  }

  /**
   * إرجاع مرجع إلى حلقة رئيسية
   * departments/
   */
  getCollection(collectionName: string): CollectionReference {
    return collection(db, collectionName);
  }

  /**
   * إرجاع مرجع لمستند داخل حلقة
   * departments/departmentId
   */
  getDocument(collectionName: string, documentId: string): DocumentReference {
    return doc(db, collectionName, documentId);
  }

  /**
   * إرجاع مرجع لحلقة فرعية داخل مستند
   * collectionName/documentId/subCollectionName/documentId/subCollectionName/
   * 
   * مثال: departments/departmentId/departments/departmentId/departments/
   */
  getSubCollection(
    collectionName: string,
    documentId: string,
    subCollectionName: string
  ): CollectionReference {
    return collection(
      db,
      collectionName,
      documentId,
      subCollectionName,
      documentId,
      subCollectionName
    );
  }

  /**
   * إرجاع مرجع لمستند داخل حلقة فرعية
   * collectionName/documentId/subCollectionName/documentId/subCollectionName/subDocumentId
   * 
   * مثال: departments/departmentId/departments/departmentId/departments/officeId
   */
  getSubDocument(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string
  ): DocumentReference {
    return doc(
      db,
      collectionName,
      documentId,
      subCollectionName,
      documentId,
      subCollectionName,
      subDocumentId
    );
  }

  /**
   * إرجاع مرجع لحلقة فرعية متعددة المستويات
   * collectionName/documentId/subCollectionName/subDocumentId/subCollectionName/subDocumentId/nestedSubCollectionName/
   * 
   * مثال: departments/departmentId/departments/cycleId/departments/cycleId/departments/inventoryItems/
   */
  getNestedSubCollection(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string,
    nestedSubCollectionName: string
  ): CollectionReference {
    return collection(
      db,
      collectionName,
      documentId,
      subCollectionName,
      subDocumentId,
      subCollectionName,
      subDocumentId,
      nestedSubCollectionName
    );
  }

  /**
   * إرجاع مرجع لمستند داخل حلقة فرعية متعددة المستويات
   * collectionName/documentId/subCollectionName/subDocumentId/subCollectionName/subDocumentId/nestedSubCollectionName/nestedDocumentId
   * 
   * مثال: departments/departmentId/departments/cycleId/departments/cycleId/departments/inventoryItems/itemId
   */
  getNestedSubDocument(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string,
    nestedSubCollectionName: string,
    nestedDocumentId: string
  ): DocumentReference {
    return doc(
      db,
      collectionName,
      documentId,
      subCollectionName,
      subDocumentId,
      subCollectionName,
      subDocumentId,
      nestedSubCollectionName,
      nestedDocumentId
    );
  }

  // ==============================
  // دوال CRUD عامة تعمل على DocumentReference/CollectionReference
  // ==============================

  /**
   * إنشاء أو تعيين بيانات مستند (يدعم الدمج) — النقطة المركزية لكل عمليات الكتابة
   */
  async setData(
    docRef: DocumentReference,
    data: { [key: string]: any },
    merge: boolean = true
  ): Promise<void> {
    // الحصول على بيانات المستخدم الحالي من localStorage (إن وجد)
    let userData: any = {};
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          userData = JSON.parse(userDataStr);
        }
      } catch (e) {
        // تجاهل الأخطاء
      }
    }

    // إنشاء خريطة جديدة تحتوي على البيانات الأصلية بالإضافة إلى الحقول الإضافية
    const newData: { [key: string]: any } = {
      ...data,
      createdByName: userData.displayName || userData.full_name || '',
      createdByImageUrl: userData.photoURL || userData.imageUrl || '',
      createdBy: userData.uid || userData.id || '',
      createTimes: Timestamp.now(),
      updatedTimes: Timestamp.now(),
    };

    // حفظ البيانات في Firestore مع إعادة المحاولة
    let retries = 3;
    while (retries > 0) {
      try {
        if (merge) {
          await setDoc(docRef, newData, { merge: true });
        } else {
          await setDoc(docRef, newData);
        }
        return; // نجحت العملية
      } catch (error: any) {
        retries--;
        if (retries === 0 || error.code !== 'unavailable') {
          throw error; // خطأ نهائي أو خطأ غير متعلق بالاتصال
        }
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * تحديث بيانات مستند — النقطة المركزية لكل عمليات التحديث
   */
  async updateData(
    docRef: DocumentReference,
    data: { [key: string]: any }
  ): Promise<void> {
    // الحصول على بيانات المستخدم الحالي من localStorage (إن وجد)
    let userData: any = {};
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          userData = JSON.parse(userDataStr);
        }
      } catch (e) {
        // تجاهل الأخطاء
      }
    }

    // إنشاء خريطة جديدة تحتوي على نسخة من البيانات الأصلية
    const updatedData: { [key: string]: any } = { ...data };

    // التحقق من الحقول الأساسية وإضافتها إذا كانت ناقصة أو فارغة
    if (!updatedData.updateByName) {
      updatedData.updateByName = (userData.displayName || userData.full_name || '').toString().trim();
    }
    if (!updatedData.updateByImageUrl) {
      updatedData.updateByImageUrl = (userData.photoURL || userData.imageUrl || '').toString().trim();
    }
    updatedData.updatedTimes = Timestamp.now();

    // تنفيذ عملية التحديث في Firestore مع إعادة المحاولة
    let retries = 3;
    while (retries > 0) {
      try {
        await updateDoc(docRef, updatedData);
        return; // نجحت العملية
      } catch (error: any) {
        retries--;
        if (retries === 0 || error.code !== 'unavailable') {
          throw error; // خطأ نهائي أو خطأ غير متعلق بالاتصال
        }
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * جلب بيانات مستند
   */
  async getData(docRef: DocumentReference): Promise<{ [key: string]: any } | null> {
    let retries = 3;
    while (retries > 0) {
      try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          return null;
        }
        const data = snap.data();
        return this.convertTimestamps(data);
      } catch (error: any) {
        retries--;
        if (retries === 0 || error.code !== 'unavailable') {
          throw error; // خطأ نهائي أو خطأ غير متعلق بالاتصال
        }
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  }

  /**
   * حذف مستند
   */
  async deleteData(docRef: DocumentReference): Promise<void> {
    await deleteDoc(docRef);
  }

  // ==============================
  // دوال للعمل مع حلقات
  // ==============================

  /**
   * جلب مستندات من حلقة مع فلترة محددة وحد
   */
  async getDocuments(
    colRef: CollectionReference,
    options?: {
      whereField?: string;
      isEqualTo?: any;
      limit?: number;
      constraints?: QueryConstraint[];
    }
  ): Promise<QueryDocumentSnapshot[]> {
    let q = query(colRef);

    if (options?.whereField && options?.isEqualTo !== undefined) {
      q = query(colRef, where(options.whereField, "==", options.isEqualTo));
    }

    if (options?.constraints && options.constraints.length > 0) {
      q = query(q, ...options.constraints);
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    // إعادة المحاولة في حالة فشل الاتصال
    let retries = 3;
    while (retries > 0) {
      try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs;
      } catch (error: any) {
        retries--;
        if (retries === 0 || error.code !== 'unavailable') {
          throw error; // خطأ نهائي أو خطأ غير متعلق بالاتصال
        }
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return [];
  }

  /**
   * تدفق مباشر للحلقة مع دعم فلتر
   */
  subscribeToCollection(
    colRef: CollectionReference,
    callback: (docs: QueryDocumentSnapshot[]) => void,
    options?: {
      whereField?: string;
      isEqualTo?: any;
      limit?: number;
    }
  ): Unsubscribe {
    let q = query(colRef);

    if (options?.whereField && options?.isEqualTo !== undefined) {
      q = query(colRef, where(options.whereField, "==", options.isEqualTo));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
      callback(querySnapshot.docs);
    });
  }

  // ==============================
  // دوال متداخلة (parent-child) عامة
  // ==============================

  /**
   * إنشاء/تعيين مستند داخل حلقة فرعية عبر setData
   */
  async setNested(
    parentCollection: string,
    parentId: string,
    subCollection: string,
    documentId: string,
    data: { [key: string]: any },
    merge: boolean = true
  ): Promise<void> {
    const docRef = this.getSubDocument(
      parentCollection,
      parentId,
      subCollection,
      documentId
    );
    await this.setData(docRef, data, merge);
  }

  /**
   * تحديث مستند داخل حلقة فرعية عبر updateData
   */
  async updateNested(
    parentCollection: string,
    parentId: string,
    subCollection: string,
    documentId: string,
    data: { [key: string]: any }
  ): Promise<void> {
    const docRef = this.getSubDocument(
      parentCollection,
      parentId,
      subCollection,
      documentId
    );
    await this.updateData(docRef, data);
  }

  /**
   * جلب مستند من حلقة فرعية
   */
  async getNested(
    parentCollection: string,
    parentId: string,
    subCollection: string,
    documentId: string
  ): Promise<{ [key: string]: any } | null> {
    const docRef = this.getSubDocument(
      parentCollection,
      parentId,
      subCollection,
      documentId
    );
    return this.getData(docRef);
  }

  /**
   * حذف مستند من حلقة فرعية
   */
  async deleteNested(
    parentCollection: string,
    parentId: string,
    subCollection: string,
    documentId: string
  ): Promise<void> {
    const docRef = this.getSubDocument(
      parentCollection,
      parentId,
      subCollection,
      documentId
    );
    await this.deleteData(docRef);
  }

  /**
   * إنشاء/تعيين مستند داخل حلقة فرعية متعددة المستويات
   */
  async setNestedDeep(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string,
    nestedSubCollectionName: string,
    nestedDocumentId: string,
    data: { [key: string]: any },
    merge: boolean = true
  ): Promise<void> {
    const docRef = this.getNestedSubDocument(
      collectionName,
      documentId,
      subCollectionName,
      subDocumentId,
      nestedSubCollectionName,
      nestedDocumentId
    );
    await this.setData(docRef, data, merge);
  }

  /**
   * تحديث مستند داخل حلقة فرعية متعددة المستويات
   */
  async updateNestedDeep(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string,
    nestedSubCollectionName: string,
    nestedDocumentId: string,
    data: { [key: string]: any }
  ): Promise<void> {
    const docRef = this.getNestedSubDocument(
      collectionName,
      documentId,
      subCollectionName,
      subDocumentId,
      nestedSubCollectionName,
      nestedDocumentId
    );
    await this.updateData(docRef, data);
  }

  /**
   * جلب مستند من حلقة فرعية متعددة المستويات
   */
  async getNestedDeep(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string,
    nestedSubCollectionName: string,
    nestedDocumentId: string
  ): Promise<{ [key: string]: any } | null> {
    const docRef = this.getNestedSubDocument(
      collectionName,
      documentId,
      subCollectionName,
      subDocumentId,
      nestedSubCollectionName,
      nestedDocumentId
    );
    return this.getData(docRef);
  }

  /**
   * حذف مستند من حلقة فرعية متعددة المستويات
   */
  async deleteNestedDeep(
    collectionName: string,
    documentId: string,
    subCollectionName: string,
    subDocumentId: string,
    nestedSubCollectionName: string,
    nestedDocumentId: string
  ): Promise<void> {
    const docRef = this.getNestedSubDocument(
      collectionName,
      documentId,
      subCollectionName,
      subDocumentId,
      nestedSubCollectionName,
      nestedDocumentId
    );
    await this.deleteData(docRef);
  }

  /**
   * تحويل Timestamps في البيانات إلى strings
   */
  private convertTimestamps(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.convertTimestamps(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        converted[key] = convertTimestampToString(value);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        converted[key] = this.convertTimestamps(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  // ==============================
  // دوال سريعة لجلب العدد فقط (بدون تحميل البيانات)
  // ==============================

  /**
   * الحصول على عدد المستندات في حلقة فرعية بشكل سريع
   * يستخدم count().get() للحصول على العدد فقط بدون تحميل البيانات
   */
  async getSubCollectionCount({
    parentCollection,
    parentId,
    subCollection,
  }: {
    parentCollection: string;
    parentId: string;
    subCollection: string;
  }): Promise<number> {
    try {
      const colRef = this.getSubCollection(parentCollection, parentId, subCollection);
      const aggregateQuery = await getCountFromServer(colRef);
      return aggregateQuery.data().count ?? 0;
    } catch (error) {
      console.error(`Error getting count for ${parentCollection}/${parentId}/${subCollection}:`, error);
      return 0;
    }
  }

  /**
   * الحصول على عدد جميع المستندات في collection group
   * يستخدم collectionGroup للحصول على كل المجموعات الفرعية بنفس الاسم
   * مثال: getAllCount('assets') يجلب عدد كل الأصول في كل المجلدات
   */
  async getAllCount(collectionName: string): Promise<number> {
    try {
      const colGroupRef = collectionGroup(db, collectionName);
      const aggregateQuery = await getCountFromServer(colGroupRef);
      return aggregateQuery.data().count ?? 0;
    } catch (error) {
      console.error(`Error getting count for collection group ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * الحصول على عدد المستندات في collection عادي
   */
  async getCollectionCount(collectionName: string): Promise<number> {
    try {
      const colRef = this.getCollection(collectionName);
      const aggregateQuery = await getCountFromServer(colRef);
      return aggregateQuery.data().count ?? 0;
    } catch (error) {
      console.error(`Error getting count for collection ${collectionName}:`, error);
      return 0;
    }
  }
}

// Export singleton instance
export const firestoreApi = FirestoreApi.Api;
