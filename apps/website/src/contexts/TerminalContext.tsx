import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CommandResult {
  success: boolean;
  response: string;
  suggestions?: string[];
  tool_calls?: any[];
  execution_time_ms?: number;
  audit_log_id?: string;
  error?: string;
}

interface TerminalContextType {
  sessionId: string | null;
  commandHistory: string[];
  isLoading: boolean;
  executeCommand: (command: string) => Promise<CommandResult>;
  clearHistory: () => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
}

interface TerminalProviderProps {
  children: ReactNode;
}

export function TerminalProvider({ children }: TerminalProviderProps) {
  const { user, profile } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      initializeSession();
    }
  }, [user, profile]);

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  };

  const initializeSession = async () => {
    if (!user || !profile) return;

    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    try {
      const { error } = await supabase
        .from('advisor_terminal_sessions')
        .insert({
          session_id: newSessionId,
          user_id: user.id,
          role: profile.role || 'advisor',
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        });

      if (error) {
        console.error('[Terminal] Error creating session:', error);
      }
    } catch (error) {
      console.error('[Terminal] Session initialization error:', error);
    }
  };

  const executeCommand = useCallback(async (command: string): Promise<CommandResult> => {
    if (!user || !profile || !sessionId) {
      return {
        success: false,
        error: 'Not authenticated or session not initialized',
        response: 'Please log in to use the terminal'
      };
    }

    setIsLoading(true);
    setCommandHistory(prev => [...prev, command]);

    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session.session) {
        throw new Error('No active session');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/advisor-terminal-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            command,
            session_id: sessionId,
            context: {
              user_id: user.id,
              role: profile.role || 'advisor',
              advisor_id: profile.role === 'advisor' ? user.id : undefined
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      await supabase
        .from('advisor_terminal_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          total_commands: commandHistory.length + 1
        })
        .eq('session_id', sessionId);

      return result;
    } catch (error) {
      console.error('[Terminal] Command execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: `Error: ${error instanceof Error ? error.message : 'Command execution failed'}`
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, profile, sessionId, commandHistory.length]);

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
  }, []);

  return (
    <TerminalContext.Provider
      value={{
        sessionId,
        commandHistory,
        isLoading,
        executeCommand,
        clearHistory
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
}
