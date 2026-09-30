import { Request, Response } from 'express';
import { City, ICityImage } from '../../models/contents/city.model';
import { sendSuccess, sendError } from '../../utils/response.util';
import { logger } from '../../utils/logger.util';
import { uploadToS3, deleteFile, extractKeyFromUrl } from '../../services/aws/s3.service';
import { sanitizeFileName } from '../../utils/fileValidation.util';
import { parseCsvBuffer, RawCsvRow } from '../../utils/csv.util';
import { Types } from 'mongoose';
import path from 'path';

/** Helper to parse image input from multipart file, JSON object, string, or undefined */
const parseImageInput = async (
  req: Request,
  defaultFolder: string = 'city',
  defaultSubFolder: string = 'image'
): Promise<ICityImage | undefined> => {
  if (req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const cleanFileName = sanitizeFileName(path.basename(req.file.originalname, ext));

    const folder = (req.body.folder || req.query.folder || defaultFolder) as string;
    const subFolder = (req.body.subFolder || req.query.subFolder || defaultSubFolder) as string;
    const fileName = `city-${Date.now()}-${cleanFileName}${ext}`;

    const uploadRes = await uploadToS3({
      file: req.file.buffer,
      folder,
      subFolder,
      fileName,
      contentType: req.file.mimetype,
    });

    return { url: uploadRes.url, key: uploadRes.key };
  }

  if (req.body.image) {
    if (typeof req.body.image === 'object') {
      return {
        url: req.body.image.url ? String(req.body.image.url).trim() : undefined,
        key: req.body.image.key ? String(req.body.image.key).trim() : undefined,
      };
    }
    if (typeof req.body.image === 'string' && req.body.image.trim()) {
      const urlStr = req.body.image.trim();
      const extractedKey = extractKeyFromUrl(urlStr);
      return { url: urlStr, key: extractedKey };
    }
  }

  if (req.body['image.url'] || req.body['image.key']) {
    return {
      url: req.body['image.url'] ? String(req.body['image.url']).trim() : undefined,
      key: req.body['image.key'] ? String(req.body['image.key']).trim() : undefined,
    };
  }

  return undefined;
};

/** Helper to generate url slug from name */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Create a new city (admin only)
 * POST /api/cities
 */
export const createCity = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { name, state, country, isPopular, isActive, seo } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendError(res, 'City name is required', 400);
    }
    if (!state || typeof state !== 'string' || !state.trim()) {
      return sendError(res, 'State name is required', 400);
    }

    const trimmedName = name.trim();
    const slug = (req.body.slug && String(req.body.slug).trim())
      ? String(req.body.slug).trim().toLowerCase()
      : generateSlug(trimmedName);

    // Check duplicate name or slug
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await City.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
        { slug },
      ],
    });

    if (existing) {
      if (existing.slug === slug) {
        return sendError(res, `City with slug '${slug}' already exists`, 409);
      }
      return sendError(res, `City '${trimmedName}' already exists`, 409);
    }

    const imageObj = await parseImageInput(req, 'city', 'image');
    if (imageObj?.key) {
      uploadedKey = imageObj.key;
    }

    // Parse SEO object if sent as JSON string (from FormData)
    let seoObj = seo;
    if (typeof seo === 'string') {
      try {
        seoObj = JSON.parse(seo);
      } catch {
        seoObj = undefined;
      }
    }

    const city = await City.create({
      name: trimmedName,
      slug,
      state: state.trim(),
      country: country ? country.trim() : 'India',
      image: imageObj,
      isPopular: isPopular === true || isPopular === 'true',
      isActive: isActive !== false && isActive !== 'false',
      seo: seoObj,
    });

    logger.info(`City created: ${city._id}`);
    return sendSuccess(res, 'City created successfully', city, 201);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[CityController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'City with this name or slug already exists', 409);
    }
    logger.error('[CityController] create error:', error);
    return sendError(res, error.message || 'Failed to create city', 500);
  }
};

/**
 * Get paginated list of cities (public & admin)
 * GET /api/cities
 */
export const getCities = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.isPopular !== undefined) {
      filter.isPopular = req.query.isPopular === 'true';
    }

    const searchStr = (req.query.search || req.query.q) as string;
    if (searchStr && searchStr.trim()) {
      const regex = new RegExp(searchStr.trim(), 'i');
      filter.$or = [
        { name: regex },
        { slug: regex },
        { state: regex },
        { country: regex },
      ];
    }

    const [items, total] = await Promise.all([
      City.find(filter)
        .sort({ isPopular: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      City.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Cities fetched successfully', {
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: any) {
    logger.error('[CityController] getCities error:', error);
    return sendError(res, 'Failed to fetch cities', 500);
  }
};

/**
 * Get city by ID (public)
 * GET /api/cities/:cityId
 */
export const getCityById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { cityId } = req.params;
    if (!Types.ObjectId.isValid(cityId)) return sendError(res, 'Invalid city ID', 400);

    const city = await City.findById(cityId).lean();
    if (!city) return sendError(res, 'City not found', 404);

    return sendSuccess(res, 'City fetched successfully', city);
  } catch (error: any) {
    logger.error('[CityController] getCityById error:', error);
    return sendError(res, 'Failed to fetch city', 500);
  }
};

/**
 * Get city by slug (public)
 * GET /api/cities/slug/:slug
 */
export const getCityBySlug = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;
    if (!slug) return sendError(res, 'Slug is required', 400);

    const city = await City.findOne({ slug: slug.toLowerCase().trim() }).lean();
    if (!city) return sendError(res, 'City not found', 404);

    return sendSuccess(res, 'City fetched successfully', city);
  } catch (error: any) {
    logger.error('[CityController] getCityBySlug error:', error);
    return sendError(res, 'Failed to fetch city', 500);
  }
};

/**
 * Update city (admin only)
 * PUT /api/cities/:cityId or PATCH /api/cities/:cityId
 */
export const updateCity = async (req: Request, res: Response): Promise<Response> => {
  let uploadedKey: string | undefined;
  try {
    const { cityId } = req.params;
    if (!Types.ObjectId.isValid(cityId)) return sendError(res, 'Invalid city ID', 400);

    const city = await City.findById(cityId);
    if (!city) return sendError(res, 'City not found', 404);

    const oldImageKey = city.image?.key || extractKeyFromUrl(city.image?.url);
    const { name, state, country, isPopular, isActive, seo } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'City name cannot be empty', 400);
      }
      city.name = name.trim();
      city.slug = generateSlug(city.name);
    }

    if (state !== undefined) {
      if (typeof state !== 'string' || !state.trim()) {
        return sendError(res, 'State name cannot be empty', 400);
      }
      city.state = state.trim();
    }

    if (country !== undefined) {
      city.country = String(country).trim() || 'India';
    }

    if (isPopular !== undefined) {
      city.isPopular = isPopular === true || isPopular === 'true';
    }

    if (isActive !== undefined) {
      city.isActive = isActive === true || isActive === 'true';
    }

    if (seo !== undefined) {
      if (typeof seo === 'string') {
        try {
          city.seo = JSON.parse(seo);
        } catch {
          // ignore invalid json
        }
      } else if (typeof seo === 'object') {
        city.seo = seo;
      }
    }

    const imageObj = await parseImageInput(req, 'city', 'image');
    if (imageObj !== undefined) {
      city.image = imageObj;
      if (imageObj?.key) {
        uploadedKey = imageObj.key;
      }
    }

    // Check duplicate name/slug on another document
    const escapedName = city.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const duplicate = await City.findOne({
      _id: { $ne: cityId },
      $or: [
        { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
        { slug: city.slug },
      ],
    });

    if (duplicate) {
      if (duplicate.slug === city.slug) {
        return sendError(res, `City slug '${city.slug}' is already in use by another city`, 409);
      }
      return sendError(res, `City '${city.name}' already exists`, 409);
    }

    await city.save();

    // Clean up old S3 image if replaced
    if (oldImageKey && city.image?.key && oldImageKey !== city.image.key) {
      deleteFile(oldImageKey).catch((err) =>
        logger.error(`[CityController] Failed to delete old S3 image ${oldImageKey}:`, err)
      );
    }

    logger.info(`City updated: ${cityId}`);
    return sendSuccess(res, 'City updated successfully', city);
  } catch (error: any) {
    if (uploadedKey) {
      deleteFile(uploadedKey).catch((err) =>
        logger.error(`[CityController] Rollback S3 image failed ${uploadedKey}:`, err)
      );
    }
    if (error.code === 11000) {
      return sendError(res, 'City with this name or slug already exists', 409);
    }
    logger.error('[CityController] update error:', error);
    return sendError(res, error.message || 'Failed to update city', 500);
  }
};

/**
 * Delete city (admin only)
 * DELETE /api/cities/:cityId
 */
export const deleteCity = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { cityId } = req.params;
    if (!Types.ObjectId.isValid(cityId)) return sendError(res, 'Invalid city ID', 400);

    const city = await City.findById(cityId);
    if (!city) return sendError(res, 'City not found', 404);

    const imageKey = city.image?.key || extractKeyFromUrl(city.image?.url);

    await City.deleteOne({ _id: cityId });

    if (imageKey) {
      deleteFile(imageKey).catch((err) =>
        logger.error(`[CityController] Failed to delete S3 image ${imageKey}:`, err)
      );
    }

    logger.info(`City deleted: ${cityId}`);
    return sendSuccess(res, 'City deleted successfully');
  } catch (error: any) {
    logger.error('[CityController] delete error:', error);
    return sendError(res, 'Failed to delete city', 500);
  }
};

/**
 * Toggle city active status (admin only)
 * PATCH /api/cities/:cityId/status
 */
export const toggleCityStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { cityId } = req.params;
    const { isActive } = req.body;
    if (!Types.ObjectId.isValid(cityId)) return sendError(res, 'Invalid city ID', 400);

    const city = await City.findByIdAndUpdate(
      cityId,
      { isActive: isActive === true || isActive === 'true' },
      { new: true, runValidators: true }
    );
    if (!city) return sendError(res, 'City not found', 404);

    return sendSuccess(res, 'City status updated successfully', city);
  } catch (error: any) {
    logger.error('[CityController] toggle status error:', error);
    return sendError(res, 'Failed to toggle city status', 500);
  }
};

export interface SkippedCityRow {
  rowNumber: number;
  name?: string;
  state?: string;
  country?: string;
  isPopular?: boolean | string;
  isActive?: boolean | string;
  slug?: string;
  reason: string;
}

const parseBooleanValue = (
  val: any,
  defaultValue: boolean
): { valid: boolean; value: boolean } => {
  if (val === undefined || val === null || String(val).trim() === '') {
    return { valid: true, value: defaultValue };
  }
  const str = String(val).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(str)) {
    return { valid: true, value: true };
  }
  if (['false', '0', 'no'].includes(str)) {
    return { valid: true, value: false };
  }
  return { valid: false, value: defaultValue };
};

/**
 * Bulk import cities from CSV (admin only)
 * POST /api/cities/import
 */
export const importCities = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file || !req.file.buffer) {
      return sendError(res, 'Please select a CSV file', 400);
    }

    let parsedResult;
    try {
      parsedResult = parseCsvBuffer(req.file.buffer);
    } catch (parseErr: any) {
      return sendError(res, parseErr.message || 'Invalid CSV file', 400);
    }

    const { headers, rows } = parsedResult;

    if (!rows || rows.length === 0) {
      return sendError(res, 'CSV file is empty', 400);
    }

    const normalizedHeaders = headers.map((h) => h.toLowerCase());
    if (!normalizedHeaders.includes('name') || !normalizedHeaders.includes('state')) {
      return sendError(res, "Invalid CSV format: Missing required columns 'name' or 'state'", 400);
    }

    const getColValue = (row: RawCsvRow, colName: string): string | undefined => {
      const targetKey = Object.keys(row).find((k) => k.toLowerCase() === colName.toLowerCase());
      if (!targetKey) return undefined;
      const val = row[targetKey];
      return val !== undefined ? String(val).trim() : undefined;
    };

    const skippedRows: SkippedCityRow[] = [];
    const validRowsToProcess: Array<{
      rowNumber: number;
      name: string;
      state: string;
      country: string;
      isPopular: boolean;
      isActive: boolean;
      slug: string;
      seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
      };
      rawName: string;
      rawState: string;
      rawCountry: string;
      rawIsPopular: any;
      rawIsActive: any;
      rawSlug: any;
    }> = [];

    const seenNamesInCsv = new Set<string>();
    const seenSlugsInCsv = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // header is row 1

      const rawName = getColValue(row, 'name') || '';
      const rawState = getColValue(row, 'state') || '';
      const rawCountry = getColValue(row, 'country') || 'India';
      const rawIsPopular = getColValue(row, 'isPopular');
      const rawIsActive = getColValue(row, 'isActive');
      const rawSlug = getColValue(row, 'slug');

      const seoTitle = getColValue(row, 'seoTitle');
      const seoDescription = getColValue(row, 'seoDescription');
      const seoKeywordsStr = getColValue(row, 'seoKeywords');

      // Validation: Name
      if (!rawName) {
        skippedRows.push({
          rowNumber,
          name: rawName,
          state: rawState,
          country: rawCountry,
          isPopular: rawIsPopular,
          isActive: rawIsActive,
          slug: rawSlug,
          reason: 'City name is required',
        });
        continue;
      }

      // Validation: State
      if (!rawState) {
        skippedRows.push({
          rowNumber,
          name: rawName,
          state: rawState,
          country: rawCountry,
          isPopular: rawIsPopular,
          isActive: rawIsActive,
          slug: rawSlug,
          reason: 'State name is required',
        });
        continue;
      }

      // Validation: isPopular
      const parsedPopular = parseBooleanValue(rawIsPopular, false);
      if (!parsedPopular.valid) {
        skippedRows.push({
          rowNumber,
          name: rawName,
          state: rawState,
          country: rawCountry,
          isPopular: rawIsPopular,
          isActive: rawIsActive,
          slug: rawSlug,
          reason: 'Invalid isPopular value',
        });
        continue;
      }

      // Validation: isActive
      const parsedActive = parseBooleanValue(rawIsActive, true);
      if (!parsedActive.valid) {
        skippedRows.push({
          rowNumber,
          name: rawName,
          state: rawState,
          country: rawCountry,
          isPopular: rawIsPopular,
          isActive: rawIsActive,
          slug: rawSlug,
          reason: 'Invalid isActive value',
        });
        continue;
      }

      // Slug resolution
      let slug = rawSlug ? rawSlug.toLowerCase().trim() : '';
      if (!slug) {
        slug = generateSlug(rawName);
      }
      if (!slug) {
        skippedRows.push({
          rowNumber,
          name: rawName,
          state: rawState,
          country: rawCountry,
          isPopular: rawIsPopular,
          isActive: rawIsActive,
          slug: rawSlug,
          reason: 'Invalid slug',
        });
        continue;
      }

      // CSV duplicate check
      const nameKey = rawName.toLowerCase();
      if (seenNamesInCsv.has(nameKey) || seenSlugsInCsv.has(slug)) {
        skippedRows.push({
          rowNumber,
          name: rawName,
          state: rawState,
          country: rawCountry,
          isPopular: rawIsPopular,
          isActive: rawIsActive,
          slug,
          reason: 'Duplicate city in CSV',
        });
        continue;
      }

      seenNamesInCsv.add(nameKey);
      seenSlugsInCsv.add(slug);

      // SEO Keywords
      let seoKeywords: string[] | undefined = undefined;
      if (seoKeywordsStr) {
        const cleanedStr = seoKeywordsStr.replace(/^"+|"+$/g, '');
        seoKeywords = cleanedStr
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      const seoObj =
        seoTitle || seoDescription || (seoKeywords && seoKeywords.length > 0)
          ? {
              title: seoTitle || undefined,
              description: seoDescription || undefined,
              keywords: seoKeywords,
            }
          : undefined;

      validRowsToProcess.push({
        rowNumber,
        name: rawName,
        state: rawState,
        country: rawCountry || 'India',
        isPopular: parsedPopular.value,
        isActive: parsedActive.value,
        slug,
        seo: seoObj,
        rawName,
        rawState,
        rawCountry,
        rawIsPopular,
        rawIsActive,
        rawSlug,
      });
    }

    if (validRowsToProcess.length > 0) {
      const namesToSearch = validRowsToProcess.map((r) => r.name);
      const slugsToSearch = validRowsToProcess.map((r) => r.slug);

      const nameRegexes = namesToSearch.map(
        (n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      );

      const existingCities = await City.find({
        $or: [{ name: { $in: nameRegexes } }, { slug: { $in: slugsToSearch } }],
      }).lean();

      const existingNamesSet = new Set(existingCities.map((c) => c.name.toLowerCase()));
      const existingSlugsSet = new Set(existingCities.map((c) => c.slug.toLowerCase()));

      const finalToInsert: typeof validRowsToProcess = [];

      for (const item of validRowsToProcess) {
        if (existingNamesSet.has(item.name.toLowerCase())) {
          skippedRows.push({
            rowNumber: item.rowNumber,
            name: item.rawName,
            state: item.rawState,
            country: item.rawCountry,
            isPopular: item.rawIsPopular,
            isActive: item.rawIsActive,
            slug: item.slug,
            reason: 'City already exists',
          });
          continue;
        }

        if (existingSlugsSet.has(item.slug.toLowerCase())) {
          skippedRows.push({
            rowNumber: item.rowNumber,
            name: item.rawName,
            state: item.rawState,
            country: item.rawCountry,
            isPopular: item.rawIsPopular,
            isActive: item.rawIsActive,
            slug: item.slug,
            reason: 'Slug already exists',
          });
          continue;
        }

        finalToInsert.push(item);
      }

      let importedCount = 0;
      for (const item of finalToInsert) {
        try {
          await City.create({
            name: item.name,
            slug: item.slug,
            state: item.state,
            country: item.country,
            isPopular: item.isPopular,
            isActive: item.isActive,
            seo: item.seo,
          });
          importedCount++;
          existingNamesSet.add(item.name.toLowerCase());
          existingSlugsSet.add(item.slug.toLowerCase());
        } catch (err: any) {
          if (err.code === 11000) {
            skippedRows.push({
              rowNumber: item.rowNumber,
              name: item.rawName,
              state: item.rawState,
              country: item.rawCountry,
              isPopular: item.rawIsPopular,
              isActive: item.rawIsActive,
              slug: item.slug,
              reason: 'City/slug already exists',
            });
          } else {
            logger.error(`[CityController] Row ${item.rowNumber} insertion error:`, err);
            skippedRows.push({
              rowNumber: item.rowNumber,
              name: item.rawName,
              state: item.rawState,
              country: item.rawCountry,
              isPopular: item.rawIsPopular,
              isActive: item.rawIsActive,
              slug: item.slug,
              reason: 'Database insertion error',
            });
          }
        }
      }

      skippedRows.sort((a, b) => a.rowNumber - b.rowNumber);

      logger.info(
        `[CityController] Import finished: Total ${rows.length}, Imported ${importedCount}, Skipped ${skippedRows.length}`
      );

      return sendSuccess(res, 'City import completed', {
        totalRows: rows.length,
        imported: importedCount,
        skipped: skippedRows.length,
        skippedRows,
      });
    } else {
      skippedRows.sort((a, b) => a.rowNumber - b.rowNumber);
      return sendSuccess(res, 'City import completed', {
        totalRows: rows.length,
        imported: 0,
        skipped: skippedRows.length,
        skippedRows,
      });
    }
  } catch (error: any) {
    logger.error('[CityController] importCities error:', error);
    return sendError(res, 'Failed to import cities. Please try again.', 500);
  }
};

