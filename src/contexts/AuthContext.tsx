import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as authAPI } from '../config/api';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const response = await authAPI.login(email, password);

      const { token, admin, company: companyData } = response;

      if (!admin || !companyData) {
        return {
          success: false,
          error: 'Invalid server response. Please try again.',
        };
      }

      localStorage.setItem('authToken', token);
      
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
      setCompany({
        id: companyData.id,
        company_name: companyData.company_name,
        company_username: companyData.company_username
      });

      localStorage.setItem('adminData', JSON.stringify(fullUser));

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const signup = async (data: any): Promise<AuthResult> => {
    try {
      const response = await authAPI.signup(data);

      const { token, admin, company: companyData } = response;

      if (!admin || !companyData) {
        return {
          success: false,
          error: 'Invalid server response. Please try again.',
        };
      }

      localStorage.setItem('authToken', token);
      
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
      setCompany({
        id: companyData.id,
        company_name: companyData.company_name,
        company_username: companyData.company_username
      });

      localStorage.setItem('adminData', JSON.stringify(fullUser));

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Signup failed. Please try again.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminData');
    setUser(null);
    setCompany(null);
  };

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.validateToken();

        if (!response.admin || !response.company) {
          throw new Error('Invalid token response');
        }

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
        setCompany({
          id: response.company.id,
          company_name: response.company.company_name,
          company_username: response.company.company_username
        });

        localStorage.setItem('adminData', JSON.stringify(fullUser));
      } catch (err) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
