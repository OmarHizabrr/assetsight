'use client';

import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthUser extends BaseModel {
  uid?: string;
}

interface LoginCredentials {
  employee_number: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const savedUser = window.localStorage.getItem("user");

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        const userModel = new BaseModel(userData);
        setUser(userModel as AuthUser);
      } catch (error) {
        // Silently handle parsing errors and clear invalid data
        window.localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);

      // البحث عن المستخدم في الجدول المستقل users/userId/ باستخدام رقم الموظف
      const employeeNumber = (credentials.employee_number || '').trim();
      const password = (credentials.password || '').trim();
      
      // التحقق الصارم من الحقول
      if (!employeeNumber || employeeNumber.length === 0) {
        throw new Error("يرجى إدخال رقم الموظف");
      }
      
      if (!password || password.length === 0) {
        throw new Error("يرجى إدخال كلمة المرور");
      }

      // الخطوة الأولى: البحث عن المستخدم بالرقم الوظيفي
      const userDocs = await firestoreApi.getDocuments(
        firestoreApi.getCollection("users"),
        {
          whereField: "employee_number",
          isEqualTo: employeeNumber
        }
      );
      
      // البحث عن مستخدم نشط
      const foundUser = userDocs.find(doc => {
        const userData = doc.data();
        return (userData.is_active === 1 || userData.is_active === true);
      });

      // إذا لم يتم العثور على المستخدم، رسالة خطأ محددة للرقم الوظيفي
      if (!foundUser) {
        throw new Error("رقم الموظف غير صحيح");
      }

      // الخطوة الثانية: التحقق من كلمة المرور
      const userData = foundUser.data();
      const storedPassword = userData.password;
      
      // التحقق من وجود كلمة مرور مخزنة
      if (!storedPassword || storedPassword === '' || storedPassword === null || storedPassword === undefined) {
        throw new Error("كلمة المرور غير موجودة في قاعدة البيانات. يرجى التواصل مع المدير");
      }
      
      // مقارنة كلمة المرور (نص عادي - يمكن تحسينه لاحقاً باستخدام hashing)
      const passwordMatch = storedPassword.trim() === password.trim();
      
      // إذا كانت كلمة المرور خاطئة، رسالة خطأ محددة لكلمة المرور
      if (!passwordMatch) {
        throw new Error("كلمة المرور غير صحيحة");
      }

      const matchingUser = BaseModel.fromFirestore(foundUser);
      setUser(matchingUser as AuthUser);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("user", JSON.stringify(matchingUser.getData()));
          window.localStorage.setItem("userData", JSON.stringify(matchingUser.getData()));
        } catch (storageError) {
          // If localStorage fails, continue anyway - user is still logged in
          // This can happen in private browsing mode or when storage is full
        }
      }
    } catch (error) {
      // Ensure error is an Error instance before re-throwing
      if (error instanceof Error) {
        throw error;
      }
      // If it's not an Error instance, wrap it
      throw new Error(error ? String(error) : "حدث خطأ غير معروف أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("userData");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

