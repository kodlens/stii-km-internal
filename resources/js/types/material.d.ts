import { Dayjs } from 'dayjs';
import { Category } from './category';

export type Material = {
  id:number;
  title: string;
  slug: string;
  content: string;
  content_text: string;
  status: string;
  submitted_at: Date;
  published_at: Date;
  publish_date?: Dayjs;
  is_publish: number;
  is_trash: number;
  is_categorized: number | boolean;
  is_vectorized: number | boolean;
  is_summarized: number | boolean;
  created_at: Date;
  updated_at: Date;

}


export type MaterialProps = Material & {
  material_categories: {
    category: Category,
    category_id: number;
    id: number;
    material_id: number;
    score: number;
    analysis: string;
    created_at: Date;
    updated_at: Date;
  }[]
};
