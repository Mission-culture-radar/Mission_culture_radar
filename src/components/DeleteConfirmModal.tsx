import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#2e0033] border border-[#C30D9B] rounded-xl shadow-xl max-w-sm w-full p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Supprimer l’événement ?</h2>
        <p className="text-sm mb-6">
          Voulez-vous vraiment supprimer <span className="font-semibold">"{eventTitle}"</span> ?
          <br />
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-white/30 hover:bg-white/10 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-[#C30D9B] hover:bg-red-600 transition"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;