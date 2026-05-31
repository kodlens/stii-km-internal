<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        $encoder = User::where('role', 'encoder')->first();

        $materials = [
            [
                'title' => 'Internal Document Control and Versioning Policy',
                'category' => 'Policies & Procedures',
                'content_text' => 'This policy defines how internal documents are created, reviewed, approved, versioned, archived, and retrieved across the knowledge management system.',
            ],
            [
                'title' => 'Records Retention and Compliance Checklist',
                'category' => 'Regulatory & Compliance Records',
                'content_text' => 'A checklist for maintaining regulatory records, audit evidence, compliance documents, certificates, and retention schedules for official organizational files.',
            ],
            [
                'title' => 'Vendor Agreement Review Guide',
                'category' => 'Contracts & Agreements',
                'content_text' => 'This guide explains the standard review process for vendor contracts, service agreements, memoranda of understanding, confidentiality clauses, and approval routing.',
            ],
            [
                'title' => 'Executive Committee Meeting Minutes Template',
                'category' => 'Meeting Minutes & Decisions',
                'content_text' => 'A standardized template for recording meeting attendance, agenda items, decisions, action owners, deadlines, and follow-up responsibilities.',
            ],
            [
                'title' => 'Knowledge Material Publishing Workflow',
                'category' => 'Standard Operating Procedures',
                'content_text' => 'Step-by-step procedure for drafting, submitting, reviewing, approving, publishing, and updating knowledge materials in the internal portal.',
            ],
            [
                'title' => 'Editorial Style and Writing Manual',
                'category' => 'Guidelines & Manuals',
                'content_text' => 'A reference manual covering writing tone, formatting standards, citation practices, document structure, and readability guidelines for knowledge materials.',
            ],
            [
                'title' => 'Project Status Report Form',
                'category' => 'Forms & Templates',
                'content_text' => 'Reusable project status report form for documenting progress, risks, blockers, milestones, next steps, and responsible staff.',
            ],
            [
                'title' => 'Digital Repository Migration Lessons Learned',
                'category' => 'Project Records',
                'content_text' => 'A project record summarizing lessons learned, issues encountered, successful practices, and recommendations from a digital repository migration initiative.',
            ],
            [
                'title' => 'Knowledge Management Metadata Reference',
                'category' => 'Reference Material',
                'content_text' => 'Reference material explaining metadata fields, category tagging, document descriptions, keywords, publication dates, and search optimization practices.',
            ],
            [
                'title' => 'New Staff Knowledge Portal Onboarding Guide',
                'category' => 'Training & Onboarding',
                'content_text' => 'Training guide for new staff covering how to search materials, submit documents, use categories, follow workflows, and request access support.',
            ],
        ];

        foreach ($materials as $index => $item) {
            $category = Category::where('category', $item['category'])->first();
            $slug = Str::slug($item['title']);

            $material = Material::updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $item['title'],
                    'content' => '<p>' . e($item['content_text']) . '</p>',
                    'content_text' => $item['content_text'],
                    'status' => 'published',
                    'published_at' => now()->subDays($index + 1),
                    'is_publish' => 1,
                    'encoded_by_id' => $encoder?->id ?? 0,
                    'updated_by_id' => $encoder?->id ?? 0,
                ]
            );

            if ($category) {
                MaterialCategory::where('material_id', $material->id)->delete();
                MaterialCategory::create([
                    'material_id' => $material->id,
                    'category_id' => $category->id,
                    'score' => 100,
                    'analysis' => 'Seeded testing category.',
                ]);
            }
        }
    }
}
