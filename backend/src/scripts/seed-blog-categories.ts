import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { BlogCategory } from '../models/contents/blogCategory.model';
import { logger } from '../utils/logger.util';

const SAMPLE_BLOG_CATEGORIES: Array<{
  name: string;
  isActive?: boolean;
}> = [
  { name: 'Flatmate Life & Advice', isActive: true },
  { name: 'Rental Tips & Agreements', isActive: true },
  { name: 'City Living & Neighborhood Guides', isActive: true },
  { name: 'Home Decor & Room Setup', isActive: true },
  { name: 'Budgeting & Expense Sharing', isActive: true },
  { name: 'Tenant Rights & Legal Information', isActive: true },
];

const generateSlug = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const seedBlogCategories = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info('[Seed Script] Seeding blog categories...');

    await BlogCategory.syncIndexes();

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of SAMPLE_BLOG_CATEGORIES) {
      const trimmedName = item.name.trim();
      const slug = generateSlug(trimmedName);

      const existing = await BlogCategory.findOne({
        $or: [{ name: trimmedName }, { slug }],
      });

      if (existing) {
        skippedCount++;
        logger.info(`[Seed Script] Blog category "${trimmedName}" already exists. Skipping.`);
      } else {
        await BlogCategory.create({
          name: trimmedName,
          slug,
          isActive: item.isActive ?? true,
        });
        insertedCount++;
        logger.info(`[Seed Script] Created blog category: "${trimmedName}" (slug: ${slug})`);
      }
    }

    logger.info(
      `[Seed Script] Completed seeding blog categories. Inserted: ${insertedCount}, Skipped: ${skippedCount}.`
    );

    await mongoose.connection.close();
    logger.info('[Seed Script] Database connection closed.');
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Error seeding blog categories:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedBlogCategories();
