import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { auth as authAPI, wsClient } from '../config/api';

/* =======================
   TYPES (MATCH APP USAGE)
======================= */

interface User {
  id: number;
  email: string;
  full_name?: string;
  role?: string;
  company_id: number;
  company_name?: string;
  company_username?: string;
}

interface Company {
  id: number;
  company_name: string;
  company_username?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (data: any) => Promise<AuthResult>;
  logout: () => void;
}

/* =======================
   CONTEXT
======================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =======================
   PROVIDER
======================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /* =======================
     LOGIN - FIXED
  ======================= */
  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const response = await authAPI.login(email, password);

      console.log('📥 Backend response:', response);

      // ✅ FIXED: Backend returns 'admin', not 'user'
      const { token, admin, company: companyData } = response;

      // ✅ FIXED: Check if admin and company exist
      if (!admin || !companyData) {
        console.error('❌ Invalid response structure:', response);
        return {
          success: false,
          error: 'Invalid server response. Please try again.',
        };
      }

      // Store token
      localStorage.setItem('authToken', token);
      
      // Set user with proper structure matching backend response
      const fullUser: User = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        company_id: admin.company_id,
        company_name: companyData.company_name,
        company_username: companyData.company_username
      };
      
      setUser(fullUser);
      // ✅ FIXED: Keep backend field names as-is
      setCompany({
        id: companyData.id,
        company_name: companyData.company_name,
        company_username: companyData.company_username
      });

      // Store admin data for other components
      localStorage.setItem('adminData', JSON.stringify(fullUser));

      // Connect to WebSocket for real-time updates
      if (companyData?.id) {
        wsClient.connect(companyData.id);
      }

      console.log('✅ Login successful:', { user: fullUser, company: companyData });

      return { success: true };
    } catch (err: any) {
      console.error('❌ Login error:', err);
      return {
        success: false,
        error: err?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  /* =======================
     SIGNUP - FIXED
  ======================= */
  const signup = async (data: any): Promise<AuthResult> => {
    try {
      const response = await authAPI.signup(data);

      console.log('📥 Signup response:', response);

      // Backend returns 'admin' and 'company'
      const { token, admin, company: companyData } = response;

      // ✅ FIXED: Check if admin and company exist
      if (!admin || !companyData) {
        console.error('❌ Invalid signup response structure:', response);
        return {
          success: false,
          error: 'Invalid server response. Please try again.',
        };
      }

      // Store token
      localStorage.setItem('authToken', token);
      
      // Set user with proper structure matching backend response
      const fullUser: User = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        company_id: admin.company_id,
        company_name: companyData.company_name,
        company_username: companyData.company_username
      };
      
      setUser(fullUser);
      // ✅ FIXED: Keep backend field names as-is
      setCompany({
        id: companyData.id,
        company_name: companyData.company_name,
        company_username: companyData.company_username
      });

      // Store admin data
      localStorage.setItem('adminData', JSON.stringify(fullUser));

      // Connect to WebSocket for real-time updates
      if (companyData?.id) {
        wsClient.connect(companyData.id);
      }

      console.log('✅ Signup successful:', { user: fullUser, company: companyData });

      return { success: true };
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      return {
        success: false,
        error: err?.message || 'Signup failed. Please try again.',
      };
    }
  };

  /* =======================
     LOGOUT
  ======================= */
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminData');
    setUser(null);
    setCompany(null);
    wsClient.disconnect();
    console.log('👋 Logged out');
  };

  /* =======================
     TOKEN VALIDATION - FIXED
  ======================= */
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔐 Validating token...');
        const response = await authAPI.validateToken();

        console.log('✅ Token valid:', response);

        // ✅ FIXED: Check if response has required fields
        if (!response.admin || !response.company) {
          console.error('❌ Invalid validation response:', response);
          throw new Error('Invalid token response');
        }

        // Set user with proper structure matching backend response
        const fullUser: User = {
          id: response.admin.id,
          email: response.admin.email,
          full_name: response.admin.full_name,
          role: response.admin.role,
          company_id: response.admin.company_id,
          company_name: response.company.company_name,
          company_username: response.company.company_username
        };
        
        setUser(fullUser);
        // ✅ FIXED: Keep backend field names as-is
        setCompany({
          id: response.company.id,
          company_name: response.company.company_name,
          company_username: response.company.company_username
        });

        // Store admin data
        localStorage.setItem('adminData', JSON.stringify(fullUser));

        // Connect to WebSocket for real-time updates
        if (response.company?.id) {
          wsClient.connect(response.company.id);
        }
      } catch (error: any) {
        console.error('❌ Token validation failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        setUser(null);
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =======================
   HOOK
======================= */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
