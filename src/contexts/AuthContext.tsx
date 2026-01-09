'use client';

import { BaseModel } from "@/lib/BaseModel";
import { firestoreApi } from "@/lib/FirestoreApi";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  isAuthenticated: boolean;
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

    const loadUserFromStorage = () => {
      try {
        const savedUser = window.localStorage.getItem("user");

        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            // التحقق من صحة البيانات قبل استخدامها
            if (userData && typeof userData === 'object') {
              const userModel = new BaseModel(userData);
              setUser(userModel as AuthUser);
            } else {
              // بيانات غير صالحة، مسحها
              window.localStorage.removeItem("user");
              window.localStorage.removeItem("userData");
            }
          } catch (parseError) {
            // خطأ في parsing البيانات، مسحها
            console.error("Error parsing user data from localStorage:", parseError);
            window.localStorage.removeItem("user");
            window.localStorage.removeItem("userData");
          }
        }
      } catch (storageError) {
        // خطأ في الوصول إلى localStorage
        console.error("Error accessing localStorage:", storageError);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
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
      let userDocs;
      try {
        userDocs = await firestoreApi.getDocuments(
          firestoreApi.getCollection("users"),
          {
            whereField: "employee_number",
            isEqualTo: employeeNumber
          }
        );
      } catch (queryError) {
        // في حالة فشل الاستعلام، إرجاع رسالة خطأ واضحة
        console.error("خطأ في استعلام قاعدة البيانات:", queryError);
        throw new Error("حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى");
      }
      
      // البحث عن مستخدم نشط
      const foundUser = userDocs.find(doc => {
        const userData = doc.data();
        return (userData.is_active === 1 || userData.is_active === true);
      });

      // إذا لم يتم العثور على المستخدم، رسالة خطأ محددة للرقم الوظيفي
      if (!foundUser) {
        // التحقق إذا كان هناك مستخدم غير نشط
        const inactiveUser = userDocs.find(doc => {
          const userData = doc.data();
          return (userData.is_active === 0 || userData.is_active === false);
        });
        
        if (inactiveUser) {
          throw new Error("حسابك غير نشط. يرجى التواصل مع المدير");
        }
        
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
      // تطبيع كلا من كلمة المرور المخزنة والمدخلة
      const normalizedStoredPassword = String(storedPassword).trim();
      const normalizedInputPassword = password.trim();
      const passwordMatch = normalizedStoredPassword === normalizedInputPassword;
      
      // إذا كانت كلمة المرور خاطئة، رسالة خطأ محددة لكلمة المرور
      if (!passwordMatch) {
        throw new Error("كلمة المرور غير صحيحة");
      }

      const matchingUser = BaseModel.fromFirestore(foundUser);
      setUser(matchingUser as AuthUser);
      
      // حفظ بيانات المستخدم في localStorage
      if (typeof window !== "undefined") {
        try {
          const userData = matchingUser.getData();
          // التحقق من صحة البيانات قبل حفظها
          if (userData && typeof userData === 'object') {
            window.localStorage.setItem("user", JSON.stringify(userData));
            window.localStorage.setItem("userData", JSON.stringify(userData));
          }
        } catch (storageError) {
          // If localStorage fails, continue anyway - user is still logged in
          // This can happen in private browsing mode or when storage is full
          console.error("Error saving user data to localStorage:", storageError);
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
      try {
        // مسح جميع بيانات المستخدم من localStorage
        window.localStorage.removeItem("user");
        window.localStorage.removeItem("userData");
        // مسح أي بيانات أخرى متعلقة بالجلسة إذا كانت موجودة
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith('user') || key.startsWith('session'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      } catch (storageError) {
        console.error("Error clearing user data from localStorage:", storageError);
        // الاستمرار حتى لو فشل مسح localStorage
      }
    }
  }, []);

  // حساب حالة المصادقة (memoized للتحسين)
  const isAuthenticated = useMemo(() => {
    return user !== null;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

