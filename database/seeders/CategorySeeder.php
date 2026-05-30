<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         $data = [
            [
                'category' => 'Policies & Procedures',
                'description' => 'Mandatory rules and directives issued by leadership; staff are required to comply.',
                'file_types' => 'Policy docs, memos, directives',
                'slug' => Str::slug('Policies & Procedures'),
                'active' => 1
            ],
            [
                'category' => 'Regulatory & Compliance Records',
                'description' => 'Documents required by law, regulation, or external audit; includes filings, certifications, and audit trails.',
                'file_types' => 'Audit reports, filings, certificates, incident logs',
                'slug' => Str::slug('Regulatory & Compliance Records'),
                'active' => 1
            ],
            [
                'category' => 'Contracts & Agreements',
                'description' => 'Legally binding documents between the organization and external or internal parties.',
                'file_types' => 'Vendor contracts, NDAs, MOUs, service agreements',
                'slug' => Str::slug('Contracts & Agreements'),
                'active' => 1
            ],
            [
                'category' => 'Meeting Minutes & Decisions',
                'description' => 'Official records of discussions, resolutions, and action items from formal meetings.',
                'file_types' => 'Minutes, decision logs, resolutions, action items',
                'slug' => Str::slug('Meeting Minutes & Decisions'),
                'active' => 1
            ],
            [
                'category' => 'Standard Operating Procedures',
                'description' => 'Step-by-step instructions for recurring or regulated tasks; staff are expected to follow them exactly.',
                'file_types' => 'SOPs, checklists, process guides, work instructions',
                'slug' => Str::slug('Standard Operating Procedures'),
                'active' => 1
            ],
            [
                'category' => 'Guidelines & Manuals',
                'description' => 'Advisory documents with recommended approaches; staff apply judgment when using them.',
                'file_types' => 'Manuals, handbooks, style guides, reference guides',
                'slug' => Str::slug('Guidelines & Manuals'),
                'active' => 1
            ],
            [
                'category' => 'Forms & Templates',
                'description' => 'Reusable, standardized files that staff fill out or adapt for recurring tasks.',
                'file_types' => 'Blank forms, document templates, boilerplates',
                'slug' => Str::slug('PoliForms & Templates'),
                'active' => 1
            ],
            [
                'category' => 'Project Records',
                'description' => 'Documentation tied to a project lifecycle — from initiation to closure.',
                'file_types' => 'Charters, status reports, post-mortems, lessons learned',
                'slug' => Str::slug('Project Records'),
                'active' => 1
            ],
            [
                'category' => 'Reference Material',
                'description' => 'Static informational content that staff consult but don\'t act on directly.',
                'file_types' => 'Charters, status reports, post-mortems, lessons learned',
                'slug' => Str::slug('Reference Material'),
                'active' => 1
            ],
            [
                'category' => 'Training & Onboarding',
                'description' => 'Content designed to build staff capability or orient new hires.',
                'file_types' => 'Onboarding packs, e-learning modules, training slides',
                'slug' => Str::slug('Training & Onboarding'),
                'active' => 1
            ],
            [
                'category' => 'FAQs & Troubleshooting',
                'description' => 'Compiled answers to common questions or known issues, capturing tacit staff knowledge.',
                'file_types' => 'FAQ documents, helpdesk articles, error guides',
                'slug' => Str::slug('FAQs & Troubleshooting'),
                'active' => 1
            ],
            [
                'category' => 'Best Practices',
                'description' => 'Proven, recommended approaches drawn from experience or industry standards; aspirational, not mandatory.',
                'file_types' => 'Practice guides, benchmark reports, case examples',
                'slug' => Str::slug('Best Practices'),
                'active' => 1
            ],
            [
                'category' => 'Research',
                'description' => 'Analytical work that informs decisions or strategy; includes data-driven reports and commissioned studies.',
                'file_types' => 'Research reports, feasibility studies, environmental scans',
                'slug' => Str::slug('Research'),
                'active' => 1
            ],


        ];

        \App\Models\Category::insertOrIgnore($data);
    }
}
