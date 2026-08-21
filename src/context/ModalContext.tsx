import React, { createContext, useContext, useState } from 'react';
import { TradingAccount } from '../types';

interface ModalContextType {
  isTerminalOpen: boolean;
  activeTerminalAccount: TradingAccount | null;
  openTerminal: (account?: TradingAccount) => void;
  closeTerminal: () => void;

  isAccountDetailsOpen: boolean;
  selectedAccount: TradingAccount | null;
  openAccountDetails: (account: TradingAccount) => void;
  closeAccountDetails: () => void;

  isChangeLeverageOpen: boolean;
  openChangeLeverage: (account: TradingAccount) => void;
  closeChangeLeverage: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeTerminalAccount, setActiveTerminalAccount] = useState<TradingAccount | null>(null);

  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);

  const [isChangeLeverageOpen, setIsChangeLeverageOpen] = useState(false);

  const openTerminal = (account?: TradingAccount) => {
    if (account) setActiveTerminalAccount(account);
    setIsTerminalOpen(true);
  };

  const closeTerminal = () => {
    setIsTerminalOpen(false);
  };

  const openAccountDetails = (account: TradingAccount) => {
    setSelectedAccount(account);
    setIsAccountDetailsOpen(true);
  };

  const closeAccountDetails = () => {
    setIsAccountDetailsOpen(false);
  };

  const openChangeLeverage = (account: TradingAccount) => {
    setSelectedAccount(account);
    setIsChangeLeverageOpen(true);
  };

  const closeChangeLeverage = () => {
    setIsChangeLeverageOpen(false);
  };

  return (
    <ModalContext.Provider
      value={{
        isTerminalOpen,
        activeTerminalAccount,
        openTerminal,
        closeTerminal,
        isAccountDetailsOpen,
        selectedAccount,
        openAccountDetails,
        closeAccountDetails,
        isChangeLeverageOpen,
        openChangeLeverage,
        closeChangeLeverage,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
};
