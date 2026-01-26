import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  return null;
};
