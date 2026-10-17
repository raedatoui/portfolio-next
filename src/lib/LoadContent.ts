import { z } from 'zod';
import bioData from '@/content/bio.json';
import employersData from '@/content/employers.json';
import headerData from '@/content/header.json';
import languagesData from '@/content/languages.json';
import techData from '@/content/tech.json';
import workData from '@/content/work.json';
import { CDN_URL } from './constants';

const HeaderDataSchema = z.object({
    nets: z.array(
        z.object({
            name: z.string(),
            link: z.string().url(),
        })
    ),
    viewsource: z.string().url(),
});

const BioDataSchema = z.object({
    content: z.string(),
    link: z.string().url(),
});

const StuffSchema = z.array(
    z.object({
        name: z.string(),
    })
);

const EmployerExperienceSchema = z.object({
    name: z.string(),
    link: z.string().url().optional(),
    dates: z.string(),
    logo: z.string(),
    logo_style: z.enum(['default', 'invert', 'theme', 'theme-svg']).optional(),
});

const EmployerSectionSchema = z.object({
    section: z.string(),
    title: z.string(),
    description: z.string(),
    experience: z.array(EmployerExperienceSchema),
});

const EmployerSchema = z.array(EmployerSectionSchema);

const WorkItemSchema = z.object({
    title: z.string(),
    thumb: z.object({
        image: z.string(),
        invert: z.boolean(),
    }),
    description: z.string(),
    links: z
        .array(
            z.object({
                label: z.string(),
                href: z.string().url(),
            })
        )
        .optional(),
    year: z.union([z.string(), z.number()]),
    tech: z.string().optional(),
    agency: z.string().optional(),
    role: z.string().optional(),
    client: z.string().optional(),
    awards: z.string().optional(),
    sub: z
        .array(
            z.object({
                title: z.string(),
                description: z.string(),
                tech: z.string(),
                video: z.string().url().optional(),
            })
        )
        .optional(),
    gallery: z
        .array(
            z.object({
                image: z.string(),
                type: z.enum(['image', 'video', 'youtube', 'vimeo']),
                asset: z.string().optional(),
                width: z.number().optional(),
                height: z.number().optional(),
                Width: z.number().optional(), // Note: there's an inconsistency in the JSON with capitalization
            })
        )
        .optional(),
});

const WorkSectionSchema = z.object({
    label: z.string(),
    description: z.string(),
    work: z.record(z.string(), WorkItemSchema),
});

const WorkDataSchema = z.object({
    typedef: WorkSectionSchema,
    // product: WorkSectionSchema,
    agency: WorkSectionSchema,
});

export type HeaderData = z.infer<typeof HeaderDataSchema>;
export type BioData = z.infer<typeof BioDataSchema>;
export type LanguageData = z.infer<typeof StuffSchema>;
export type TechData = z.infer<typeof StuffSchema>;
export type EmployerData = z.infer<typeof EmployerSchema>;
export type WorkItemData = z.infer<typeof WorkItemSchema>;
export type WorkSectionData = z.infer<typeof WorkSectionSchema>;
export type WorkData = z.infer<typeof WorkDataSchema>;

export interface ContentData {
    header: HeaderData;
    bio: BioData;
    languages: LanguageData;
    tech: TechData;
    employers: EmployerData;
    work: WorkData;
}

export const loadContent = (): ContentData => {
    try {
        const header = HeaderDataSchema.parse(headerData);
        const bio = BioDataSchema.parse(bioData);
        const languages = StuffSchema.parse(languagesData);
        const tech = StuffSchema.parse(techData);
        const employers = EmployerSchema.parse(employersData);
        const work = WorkDataSchema.parse(workData);

        // Post-process work data to prepend CDN_URL
        Object.values(work).forEach((section) => {
            Object.values(section.work).forEach((project) => {
                // Prefix CDN assets while preserving locally hosted thumbnails
                if (project.thumb.image.startsWith('/assets/')) {
                    project.thumb.image = `${CDN_URL}${project.thumb.image}`;
                }

                // Update gallery images
                if (project.gallery) {
                    project.gallery.forEach((item) => {
                        // Normalize Width to width
                        if (item.Width && !item.width) {
                            item.width = item.Width;
                        }

                        if (item.type === 'image' || item.type === 'video') {
                            item.image = `${CDN_URL}${item.image}`;
                        }
                    });
                }
            });
        });

        // Post-process employers data to prepend CDN_URL
        employers.forEach((section) => {
            section.experience.forEach((exp) => {
                exp.logo = `${CDN_URL}${exp.logo}`;
            });
        });

        console.log('All content validated successfully');

        return {
            header,
            bio,
            languages,
            tech,
            employers,
            work,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Content validation failed:', error.issues);
            throw new Error(`Content validation failed: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        throw error;
    }
};
