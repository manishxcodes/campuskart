'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MakeOfferModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  userEmail?: string;
  ownerEmail?: string;
}

export function MakeOfferModal({
  open,
  onClose,
  productId,
  productTitle,
  userEmail = '',
  ownerEmail = '',
}: MakeOfferModalProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    userEmail,
    ownerEmail,
    offer: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.userEmail ||
      !formData.ownerEmail ||
      !formData.offer
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/send-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          userEmail: formData.userEmail,
          ownerEmail: formData.ownerEmail,
          productId,
          productTitle,
          offer: formData.offer,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send offer');
      }

      toast.success('Offer sent successfully!');

      setFormData({
        userEmail,
        ownerEmail,
        offer: '',
      });

      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);

      toast.error('Failed to send offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Make an Offer
          </DialogTitle>

          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Title */}
          <div className="space-y-2">
            <Label htmlFor="product" className="text-muted-foreground">
              Product
            </Label>

            <Input
              id="product"
              value={productTitle}
              disabled
              className="bg-muted border-border text-muted-foreground"
            />
          </div>

          {/* Your Email */}
          <div className="space-y-2">
            <Label
              htmlFor="userEmail"
              className="text-muted-foreground"
            >
              Your Email
            </Label>

            <Input
              id="userEmail"
              name="userEmail"
              type="email"
              value={formData.userEmail}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Owner Email */}
          <div className="space-y-2">
            <Label
              htmlFor="ownerEmail"
              className="text-muted-foreground"
            >
              Owner Email
            </Label>

            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={handleChange}
              placeholder="owner@email.com"
              disabled
              className="bg-muted border-border text-muted-foreground"
            />
          </div>

          {/* Offer */}
          <div className="space-y-2">
            <Label
              htmlFor="offer"
              className="text-muted-foreground"
            >
              Your Offer
            </Label>

            <Textarea
              id="offer"
              name="offer"
              value={formData.offer}
              onChange={handleChange}
              placeholder="Enter your offer details..."
              rows={5}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Offer'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}