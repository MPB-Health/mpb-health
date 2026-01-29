import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Terminal, Send, Loader2, X, Minimize2, HelpCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { useTerminal } from '../../contexts/TerminalContext';

interface TerminalLine {
  type: 'command' | 'response' | 'error' | 'info' | 'success';
  content: string;
  timestamp: Date;
}

interface AdvisorTerminalProps {
  onClose?: () => void;
  defaultMinimized?: boolean;
}

export function AdvisorTerminal({ onClose, defaultMinimized = false }: AdvisorTerminalProps) {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: 'info',
      content: 'MPB Health Advisor Terminal v1.0',
      timestamp: new Date()
    },
    {
      type: 'info',
      content: 'Type "/help" for available commands',
      timestamp: new Date()
    }
  ]);
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { executeCommand, commandHistory, isLoading: _isLoading } = useTerminal();

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSubmit = async () => {
    if (!input.trim() || isExecuting) return;

    const command = input.trim();
    setInput('');
    setHistoryIndex(-1);

    setLines(prev => [...prev, {
      type: 'command',
      content: `> ${command}`,
      timestamp: new Date()
    }]);

    if (command === '/help') {
      handleHelp();
      return;
    }

    if (command === '/clear') {
      setLines([]);
      return;
    }

    if (command === '/history') {
      handleHistory();
      return;
    }

    setIsExecuting(true);

    try {
      const result = await executeCommand(command);

      if (result.success) {
        setLines(prev => [...prev, {
          type: 'success',
          content: result.response,
          timestamp: new Date()
        }]);

        if (result.suggestions && result.suggestions.length > 0) {
          setLines(prev => [...prev, {
            type: 'info',
            content: `\nSuggestions:\n${result.suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
            timestamp: new Date()
          }]);
        }
      } else {
        setLines(prev => [...prev, {
          type: 'error',
          content: `Error: ${result.error || 'Command failed'}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setLines(prev => [...prev, {
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleHelp = () => {
    const helpText = `
Available Commands:
  /help                    Show this help message
  /tools                   List all available tools
  /history                 Show command history
  /clear                   Clear terminal

Natural Language Commands:
  > Show me my stats for this month
  > Get care plus enrollment link
  > Look up member john@example.com
  > What are the IUA options?
  > Draft welcome email for new member

Examples:
  > show approved links
  > lookup member by email
  > get my performance stats
  > search for HSA information
    `.trim();

    setLines(prev => [...prev, {
      type: 'info',
      content: helpText,
      timestamp: new Date()
    }]);
  };

  const handleHistory = () => {
    if (commandHistory.length === 0) {
      setLines(prev => [...prev, {
        type: 'info',
        content: 'No command history yet',
        timestamp: new Date()
      }]);
      return;
    }

    const historyText = commandHistory
      .slice(-10)
      .reverse()
      .map((cmd, i) => `  ${commandHistory.length - i}. ${cmd}`)
      .join('\n');

    setLines(prev => [...prev, {
      type: 'info',
      content: `Recent commands:\n${historyText}`,
      timestamp: new Date()
    }]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setLines([]);
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-cyan-400';
      case 'response': return 'text-gray-200';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
        >
          <Terminal className="w-5 h-5 mr-2" />
          Open Terminal
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-full max-w-3xl h-[600px] z-50 bg-gray-900 border-gray-700 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-mono text-gray-200">mpb-advisor</span>
          {isExecuting && (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelp}
            className="text-gray-400 hover:text-gray-200"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-200"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2 bg-gray-950"
      >
        {lines.map((line, index) => (
          <div key={index} className={`whitespace-pre-wrap ${getLineColor(line.type)}`}>
            {line.content}
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center gap-2 text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 bg-gray-800 p-3">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-sm">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Type a command or question..."
            className="flex-1 bg-gray-900 text-gray-200 border border-gray-700 rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isExecuting}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500 font-mono">
          Press Enter to execute | ↑↓ for history | Ctrl+L to clear
        </div>
      </div>
    </Card>
  );
}
