import type { AssetSearchInput, CreateAssetInput, PaginationQuery, UpdateAssetInput } from "@erp/shared";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { buildPaginationArgs, toPaginatedResult } from "../../lib/pagination";

async function findOrThrow(schoolId: string, id: string) {
  const asset = await prisma.asset.findFirst({ where: { id, schoolId, deletedAt: null } });
  if (!asset) throw new NotFoundError("Asset not found");
  return asset;
}

export async function listAssets(schoolId: string, pagination: PaginationQuery, filters: AssetSearchInput) {
  const { page, pageSize, skip, take } = buildPaginationArgs(pagination);
  const where = {
    schoolId,
    deletedAt: null,
    ...(filters.category ? { category: filters.category } : {}),
    ...(pagination.search
      ? {
          OR: [
            { name: { contains: pagination.search, mode: "insensitive" as const } },
            { location: { contains: pagination.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.asset.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.asset.count({ where }),
  ]);

  return toPaginatedResult(data, total, page, pageSize);
}

export async function getAsset(schoolId: string, id: string) {
  return findOrThrow(schoolId, id);
}

export async function createAsset(schoolId: string, input: CreateAssetInput) {
  return prisma.asset.create({
    data: {
      schoolId,
      name: input.name,
      category: input.category,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      location: input.location,
      condition: input.condition,
    },
  });
}

export async function updateAsset(schoolId: string, id: string, input: UpdateAssetInput) {
  await findOrThrow(schoolId, id);
  return prisma.asset.update({ where: { id }, data: input });
}

export async function deleteAsset(schoolId: string, id: string) {
  await findOrThrow(schoolId, id);
  return prisma.asset.update({ where: { id }, data: { deletedAt: new Date() } });
}
