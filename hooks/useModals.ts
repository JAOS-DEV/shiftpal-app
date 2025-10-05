import { useState } from "react";

interface ModalState {
  showOvertimeSheet: boolean;
  showNightSheet: boolean;
  showWeekendSheet: boolean;
  showWeekStartPicker: boolean;
  helpModal: {
    visible: boolean;
    title: string;
    body: string;
  };
}

export const useModals = () => {
  const [modalState, setModalState] = useState<ModalState>({
    showOvertimeSheet: false,
    showNightSheet: false,
    showWeekendSheet: false,
    showWeekStartPicker: false,
    helpModal: {
      visible: false,
      title: "",
      body: "",
    },
  });

  const openModal = (modalName: keyof Omit<ModalState, "helpModal">) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: true,
    }));
  };

  const closeModal = (modalName: keyof Omit<ModalState, "helpModal">) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: false,
    }));
  };

  const openHelpModal = (title: string, body: string) => {
    setModalState(prev => ({
      ...prev,
      helpModal: {
        visible: true,
        title,
        body,
      },
    }));
  };

  const closeHelpModal = () => {
    setModalState(prev => ({
      ...prev,
      helpModal: {
        visible: false,
        title: "",
        body: "",
      },
    }));
  };

  return {
    ...modalState,
    openModal,
    closeModal,
    openHelpModal,
    closeHelpModal,
  };
};
