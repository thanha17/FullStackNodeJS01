import { createContext, useEffect, useState } from 'react';
import { getAccountApi } from '../../util/api';

export const AuthContext = createContext({
  isAuthenticated: false,
  user: {
    email: "",
    name: ""
  },
  appLoading: true,
});

export const AuthWrapper = (props) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: {
      email: "",
      name: ""
    }
  });

  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
          const acc = await getAccountApi();
          if (acc?.email) {
            setAuth({ isAuthenticated: true, user: { email: acc.email, name: acc.name || '' } });
          } else {
            setAuth({ isAuthenticated: false, user: { email: '', name: '' } });
          }
        }
      } catch {}
      setAppLoading(false);
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{
      auth, setAuth, appLoading, setAppLoading
    }}>
      {props.children}
    </AuthContext.Provider>
  );
};