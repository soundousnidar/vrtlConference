import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import api from '@/lib/api';

interface Review {
  id: number;
  comment: string;
  decision: 'ACCEPTED' | 'REJECTED';
  reviewer: {
    fullname: string;
  };
}

const AbstractReviews: React.FC = () => {
  const { abstractId } = useParams<{ abstractId: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abstractTitle, setAbstractTitle] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!abstractId) return;
      setLoading(true);
      try {
        // This endpoint needs to be created on the backend
        const response = await api.get(`/abstracts/${abstractId}/reviews`);
        setReviews(response.data.reviews);
        setAbstractTitle(response.data.abstract_title);
      } catch (err) {
        setError('Impossible de charger les reviews pour cet abstract.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [abstractId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <MessageSquare className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Reviews pour l'abstract : "{abstractTitle}"</h1>
      </div>
      {loading ? (
        <p>Chargement des reviews...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : reviews.length === 0 ? (
        <p>Aucune review n'a encore été soumise pour cet abstract.</p>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Review de {review.reviewer.fullname}</span>
                  <Badge variant={review.decision === 'ACCEPTED' ? 'default' : 'destructive'} className="flex items-center gap-1">
                    {review.decision === 'ACCEPTED' ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                    {review.decision}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{review.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AbstractReviews; 