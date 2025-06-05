import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Upload } from 'lucide-react';
import { VenueEnum } from '@/types/conference';
import { format } from 'date-fns';

interface ConferenceFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: {
    title?: string;
    description?: string;
    deadline?: string;
    important_date?: string;
    fees?: number;
    venue?: VenueEnum;
    thematic?: string[];
    image_url?: string;
  };
  isEditing?: boolean;
}

interface FormState {
  title: string;
  description: string;
  deadline: string;
  important_date: string;
  fees: number;
  venue: VenueEnum;
  thematic: string;
}

const ConferenceForm: React.FC<ConferenceFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [formState, setFormState] = useState<FormState>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    deadline: initialData?.deadline ? format(new Date(initialData.deadline), 'yyyy-MM-dd') : '',
    important_date: initialData?.important_date ? format(new Date(initialData.important_date), 'yyyy-MM-dd') : '',
    fees: initialData?.fees || 0,
    venue: initialData?.venue || VenueEnum.ONLINE,
    thematic: initialData?.thematic?.join(', ') || '',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'fees' ? parseFloat(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    
    try {
      // Debug logging
      console.log('=== Form Submission Debug ===');
      console.log('Raw form state:', formState);
      
      // Process and validate form data
      const processedData = {
        title: formState.title.trim(),
        description: formState.description.trim(),
        deadline: formState.deadline,
        important_date: formState.important_date,
        fees: parseFloat(formState.fees.toString()),
        venue: formState.venue,
        thematic: formState.thematic
      };
      
      console.log('Processed data:', processedData);
      
      // Validate required fields
      if (!processedData.title) {
        throw new Error('Le titre est requis');
      }
      if (!processedData.deadline) {
        throw new Error('La date limite est requise');
      }
      if (!processedData.important_date) {
        throw new Error('La date importante est requise');
      }
      if (isNaN(processedData.fees) || processedData.fees < 0) {
        throw new Error('Les frais doivent être un nombre positif');
      }
      if (!processedData.thematic) {
        throw new Error('Au moins une thématique est requise');
      }
      
      // Add validated data to FormData
      Object.entries(processedData).forEach(([key, value]) => {
        if (key === 'thematic') {
          // Convert thematic to array and send as JSON string
          const thematicArray = (value as string)
            .split(',')
            .map(t => t.trim())
            .filter(t => t);
          formData.append('thematic', JSON.stringify(thematicArray));
        } else if (key === 'fees') {
          // Ensure fees is sent as a string
          formData.append('fees', value.toString());
        } else if (key === 'venue') {
          // Ensure venue is sent correctly
          formData.append('venue', value.toString());
        } else {
          formData.append(key, value.toString());
        }
      });
      
      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      console.log('Final form data:', Object.fromEntries(formData.entries()));
      
      await onSubmit(formData);
    } catch (error) {
      console.error('Form validation error:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Titre de la conférence</Label>
        <Input
          id="title"
          name="title"
          value={formState.title}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formState.description}
          onChange={handleInputChange}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deadline">Date limite</Label>
          <div className="relative">
            <Input
              id="deadline"
              name="deadline"
              type="date"
              value={formState.deadline}
              onChange={handleInputChange}
              required
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="important_date">Date importante</Label>
          <div className="relative">
            <Input
              id="important_date"
              name="important_date"
              type="date"
              value={formState.important_date}
              onChange={handleInputChange}
              required
            />
            <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fees">Frais de participation (DH)</Label>
          <Input
            id="fees"
            name="fees"
            type="number"
            min="0"
            step="0.01"
            value={formState.fees}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue">Type d'événement</Label>
          <select
            id="venue"
            name="venue"
            value={formState.venue}
            onChange={handleInputChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          >
            <option value={VenueEnum.ONLINE}>En ligne</option>
            <option value={VenueEnum.IN_PERSON}>Présentiel</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thematic">Thématiques (séparées par des virgules)</Label>
        <Input
          id="thematic"
          name="thematic"
          value={formState.thematic}
          onChange={handleInputChange}
          placeholder="IA, Machine Learning, Data Science"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image de la conférence (optionnelle)</Label>
        <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-md">
          {previewUrl && (
            <div className="mb-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-48 rounded-md"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="image"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              <span>{isEditing ? 'Changer l\'image' : 'Ajouter une image'}</span>
            </label>
            {selectedImage && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
              >
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? 'Mettre à jour la conférence' : 'Créer la conférence'}
      </Button>
    </form>
  );
};

export default ConferenceForm; 