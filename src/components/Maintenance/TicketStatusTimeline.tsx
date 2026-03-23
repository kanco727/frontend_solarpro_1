import React from 'react';

interface Props {
  statut: string;
}

export default function TicketStatusTimeline({ statut }: Props) {
  const steps = [
    { id: 'ouvert', label: 'Ouvert', color: 'blue' },
    { id: 'en_cours', label: 'En cours', color: 'orange' },
    { id: 'rapport_envoye', label: 'Rapport', color: 'purple' },
    { id: 'termine', label: 'Terminé', color: 'green' },
  ];

  // Trouver l’étape active
  const currentIndex = steps.findIndex(s => s.id === statut);

  return (
    <div className="flex items-center justify-between mt-3">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center w-full">
          <div className="flex flex-col items-center">
            {/* Cercle */}
            <div
              className={`w-5 h-5 rounded-full border-2 ${
                i <= currentIndex
                  ? `bg-${step.color}-500 border-${step.color}-500`
                  : 'bg-gray-200 border-gray-300'
              }`}
            />
            {/* Label */}
            <p
              className={`text-xs mt-1 ${
                i <= currentIndex ? `text-${step.color}-600` : 'text-gray-400'
              }`}
            >
              {step.label}
            </p>
          </div>

          {/* Ligne entre les points */}
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-[2px] ${
                i < currentIndex ? `bg-${steps[i].color}-500` : 'bg-gray-300'
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}
