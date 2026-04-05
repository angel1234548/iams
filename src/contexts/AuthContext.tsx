import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User, UserRole, Student, Organization, Coordinator } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Student | Organization | Coordinator | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Student | Organization | Coordinator | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, role: UserRole) => {
    try {
      if (role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        setProfile(data);
      } else if (role === 'organization') {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        setProfile(data);
      } else if (role === 'coordinator') {
        const { data, error } = await supabase
          .from('coordinators')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (error) throw error;
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.role);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Call the server-side function — bcrypt comparison happens in Postgres,
    // the plaintext password and hash never meet on the client
    const { data, error } = await supabase.rpc('verify_user_login', {
      p_email: email,
      p_password: password,
    });

    if (error || !data || data.length === 0) {
      throw new Error('Invalid email or password');
    }

    const userData = data[0];

    const userObj: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role as UserRole,
    };

    setUser(userObj);
    await fetchProfile(userObj.id, userObj.role);
    localStorage.setItem('iams_user', JSON.stringify(userObj));
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('iams_user');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('iams_user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser) as User;
      setUser(userObj);
      fetchProfile(userObj.id, userObj.role).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
