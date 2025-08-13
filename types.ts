
export interface FlashcardItem {
  id: string;
  text: string;
  audioUrl: string;
  imageUrl: string | null;
  isLoading: boolean;
}
