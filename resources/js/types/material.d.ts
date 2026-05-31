export type Material = {
  id:number;
  title: string;
  slug: string;
  content: string;
  content_text: string;
  status: string;
  submitted_at: Date;
  published_at: Date;
  is_publish: number;
  is_trash: number;
  crated_at: Date;
  updated_at: Date;

}


type MaterialProps = Material & {
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
