import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Abstract } from '@/types/conference';
import { X, Plus, Upload } from 'lucide-react';

interface Author {
  first_name: string;
  last_name: string;
  email?: string;
  affiliation?: string;
}

interface AbstractSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conferenceId: number;
  onSubmit?: (formData: FormData) => Promise<void>;
  abstract?: Abstract;
  mode?: 'create' | 'edit';
}

const AbstractSubmissionModal: React.FC<AbstractSubmissionModalProps> = ({
  isOpen,
  onClose,
  conferenceId,
  onSubmit,
  abstract,
  mode = 'create'
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState('');
  const [authors, setAuthors] = useState<Author[]>([{ first_name: '', last_name: '', email: '', affiliation: '' }]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (abstract && mode === 'edit') {
      setTitle(abstract.title);
      setSummary(abstract.summary);
      setKeywords(abstract.keywords);
      // If the abstract has authors, set them
      if (abstract.authors && abstract.authors.length > 0) {
        setAuthors(abstract.authors.map(author => ({
          first_name: author.first_name,
          last_name: author.last_name,
          email: author.email || '',
          affiliation: author.affiliation || ''
        })));
      }
    }
  }, [abstract, mode]);

  const handleAddAuthor = () => {
    setAuthors([...authors, { first_name: '', last_name: '', email: '', affiliation: '' }]);
  };

  const handleRemoveAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const handleAuthorChange = (index: number, field: keyof Author, value: string) => {
    const newAuthors = [...authors];
    newAuthors[index] = { ...newAuthors[index], [field]: value };
    setAuthors(newAuthors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary);
      formData.append('keywords', keywords);
      formData.append('authors', JSON.stringify(authors));
      formData.append('conference_id', conferenceId.toString());
      
      if (file) {
        formData.append('file', file);
      }

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default submission logic
        const response = await fetch(`http://localhost:8001/abstracts/submit-abstract`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors de la soumission de l\'abstract');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting abstract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Soumettre un Abstract' : 'Modifier l\'Abstract'}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Veuillez remplir le formulaire pour soumettre votre abstract.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="summary">Résumé</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Auteurs</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAuthor}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un auteur
              </Button>
            </div>
            {authors.map((author, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                {authors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveAuthor(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={author.first_name}
                      onChange={(e) => handleAuthorChange(index, 'first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={author.last_name}
                      onChange={(e) => handleAuthorChange(index, 'last_name', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email (optionnel)</Label>
                    <Input
                      type="email"
                      value={author.email}
                      onChange={(e) => handleAuthorChange(index, 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Affiliation (optionnel)</Label>
                    <Input
                      value={author.affiliation}
                      onChange={(e) => handleAuthorChange(index, 'affiliation', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="file">Document (PDF ou DOCX)</Label>
            <div className="mt-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Label
                htmlFor="file"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
              >
                <Upload className="h-6 w-6" />
                <span>
                  {file ? file.name : 'Cliquez pour sélectionner un fichier'}
                </span>
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : mode === 'create' ? 'Soumettre' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AbstractSubmissionModal;
