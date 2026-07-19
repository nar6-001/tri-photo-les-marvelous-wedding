import React from 'react';
import { 
  Sparkles, Camera, MapPin, Wine, Glasses, Music, HelpCircle, Heart, Star, Clock
} from 'lucide-react';
import { CategoryTab } from '../types';

interface ExploreCard {
  id: string;
  title: string;
  description: string;
  tag: string;
  colorBg: string;
  borderColor: string;
  textColor: string;
  icon: any;
  category: CategoryTab;
}

interface ExploreViewProps {
  onSelectCategory: (category: CategoryTab) => void;
  activeFilter: CategoryTab;
  categoryLabels: Record<string, string>;
}

export default function ExploreView({ onSelectCategory, activeFilter, categoryLabels }: ExploreViewProps) {
  const weddingAlbums: ExploreCard[] = [
    {
      id: 'all',
      title: 'Toutes les photos de noces',
      description: 'Parcourir l\'intégralité des clichés chargés de votre journée d\'exception.',
      tag: 'Album Complet',
      colorBg: 'bg-white',
      borderColor: 'border-brand-sage/40',
      textColor: 'text-brand-olive',
      icon: Sparkles,
      category: 'Tout'
    },
    ...Object.entries(categoryLabels).map(([key, label], idx) => {
      const icons = [Camera, Wine, Music, Glasses, Heart, Star, MapPin];
      const icon = icons[idx % icons.length];

      const colors = [
        { bg: 'bg-brand-olive', border: 'border-brand-moss', text: 'text-brand-cream', tagBg: 'bg-brand-moss text-brand-cream' },
        { bg: 'bg-white', border: 'border-brand-sage/40', text: 'text-brand-olive', tagBg: 'bg-brand-sand text-brand-sage' },
        { bg: 'bg-brand-sand/50', border: 'border-brand-sage/30', text: 'text-brand-moss', tagBg: 'bg-brand-sand text-brand-sage' }
      ];
      const color = colors[idx % colors.length];

      return {
        id: `cat-${key}`,
        title: label,
        description: `Visualiser les clichés associés à la série "${label}".`,
        tag: `Série ${label}`,
        colorBg: color.bg,
        borderColor: color.border,
        textColor: color.text,
        icon: icon,
        category: key
      };
    })
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-brand-cream text-brand-moss no-scrollbar">
      
      {/* Title */}
      <div className="select-text text-center pt-2">
        <h2 className="text-3xl font-serif-display font-bold text-brand-olive text-center">
          Portails de Sélection
        </h2>
        <p className="text-xs text-brand-sage mt-1 font-serif-display italic">
          Explorez les différents segments de votre journée pour trier vos photos par ambiance !
        </p>
        <div className="w-16 h-[1px] bg-brand-gold/60 mx-auto mt-2" />
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 gap-4">
        {weddingAlbums.map((card) => {
          const IconComponent = card.icon;
          const isSelected = activeFilter === card.category;
          const isDark = card.colorBg.includes('bg-brand-olive');
          
          return (
            <button
               id={`explore-${card.id}`}
              key={card.id}
              onClick={() => onSelectCategory(card.category)}
              className={`text-left relative rounded-xl border-2 p-4 flex flex-col justify-between h-28 duration-300 transform active:scale-[0.98] shadow-sm hover:shadow-md cursor-pointer ${card.colorBg} ${card.borderColor} ${
                isSelected ? 'ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-cream scale-[0.99]' : ''
              }`}
            >
              <div className="w-full flex items-center justify-between">
                {/* Icon wrapper */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/20 text-brand-cream' : 'bg-brand-sand text-brand-olive'}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                {/* Tag */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDark ? 'bg-brand-moss text-brand-cream' : 'bg-brand-sand text-brand-sage'}`}>
                  {card.tag}
                </span>
              </div>

              {/* Text lines */}
              <div className="mt-2">
                <h3 className={`font-serif-display font-bold text-[14px] ${card.textColor}`}>{card.title}</h3>
                <p className={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-brand-cream/80' : 'text-brand-sage'}`}>{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Integrated Timeline matching the uploaded picture's 1-to-1 elegant visual concept */}
      <div className="mt-8 border-t border-brand-sage/20 pt-6">
        <h3 className="font-serif-display text-lg text-center text-brand-olive font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Clock className="w-4 h-4 text-brand-gold" />
          Timeline du Mariage
        </h3>
        <p className="text-[10px] text-center text-brand-sage uppercase tracking-wider mb-5">Déroulé officiel du Jour J</p>
        
        {/* Simple elegant vertical timeline cards */}
        <div className="space-y-4 relative pl-4 border-l border-brand-sage/30 mt-3 text-left">
          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-gold border-2 border-white" />
            <span className="text-[9px] font-bold text-brand-sage uppercase">16h00 · Cérémonie Laïque</span>
            <h4 className="text-xs font-serif-display font-bold text-brand-olive">The Ceremony</h4>
            <p className="text-[10px] text-brand-sage mt-0.5 leading-snug">Se tiendra en extérieur dans le jardin d'oliviers bordé par la tonnelle.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-olive border-2 border-white" />
            <span className="text-[9px] font-bold text-brand-sage uppercase">17h00 · Cocktail des mariés</span>
            <h4 className="text-xs font-serif-display font-bold text-brand-olive">Cocktail Hour</h4>
            <p className="text-[10px] text-brand-sage mt-0.5 leading-snug">Spécialités régionales et rafraîchissements au son du quatuor.</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-sage border-2 border-white" />
            <span className="text-[9px] font-bold text-brand-gold uppercase">18h30 · Dîner, toasts &amp; Bal</span>
            <h4 className="text-xs font-serif-display font-bold text-brand-olive">Dinner, Let's Party</h4>
            <p className="text-[10px] text-brand-sage mt-0.5 leading-snug">Repas bistronomique sous la grande verrière.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
