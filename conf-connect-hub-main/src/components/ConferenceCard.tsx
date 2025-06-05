import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Euro, Clock, ChevronRight, Image as ImageIcon, ClipboardList } from 'lucide-react';
import { Conference, VenueEnum } from '@/types/conference';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

interface ConferenceCardProps {
  conference: Conference;
  showReviewButton?: boolean; // Optional prop to control review button visibility
}

const ConferenceCard = ({ conference, showReviewButton = false }: ConferenceCardProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.log('Image failed to load:', conference.image_url);
    setImageError(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full flex h-40">
      {/* Image */}
      <div className="relative w-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {!imageError ? (
          <img 
            src={conference.image_url || '/placeholder.svg'} 
            alt={conference.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {conference.tags && (
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {conference.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-white/90 dark:bg-gray-800/90 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold line-clamp-1 mb-1">{conference.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{conference.description}</p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <UserIcon className="w-4 h-4" />
              <span className="truncate">{conference.organizer_name}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(conference.important_date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          {showReviewButton && (
            <Link to="/reviewer/invitations">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm">Gérer les Reviews</span>
              </Button>
            </Link>
          )}
          <Link to={`/conference/${conference.id}`}>
            <Button variant="secondary" size="sm" className="flex items-center gap-1">
              <span className="text-sm">Voir les détails</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConferenceCard;
