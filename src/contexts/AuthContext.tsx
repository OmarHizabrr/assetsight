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
  username: string;
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
        console.error("Error parsing saved user:", error);
        window.localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);

      // البحث عن المستخدم في الجدول المستقل users/userId/
      const username = credentials.username.trim();
      const userDocs = await firestoreApi.getDocuments(
        firestoreApi.getCollection("users"),
        {
          whereField: "username",
          isEqualTo: username
        }
      );
      
      const foundUser = userDocs.find(doc => {
        const userData = doc.data();
        return (userData.is_active === 1 || userData.is_active === true);
      });

      if (!foundUser) {
        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      }

      const matchingUser = BaseModel.fromFirestore(foundUser);
      setUser(matchingUser as AuthUser);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(matchingUser.getData()));
        window.localStorage.setItem("userData", JSON.stringify(matchingUser.getData()));
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

