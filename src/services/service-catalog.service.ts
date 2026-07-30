import "server-only";

import {
  serviceCatalogRepository,
  type ServiceCatalogPersistenceInput,
} from "@/repositories/service-catalog.repository";
import {
  parseBrlValue,
  serviceCatalogFormSchema,
  serviceCatalogIdSchema,
  serviceCatalogListQuerySchema,
  type ServiceCatalogFormInput,
} from "@/schemas/service-catalog.schema";

const SERVICES_PER_PAGE = 10;

export class ServiceCatalogServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceCatalogServiceError";
  }
}

function normalizeInput(
  input: ServiceCatalogFormInput,
): ServiceCatalogPersistenceInput {
  const defaultPrice = parseBrlValue(input.defaultPrice);

  if (defaultPrice === null) {
    throw new ServiceCatalogServiceError("O preço informado é inválido.");
  }

  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    defaultPrice,
    estimatedMinutes: input.estimatedMinutes
      ? Number(input.estimatedMinutes)
      : null,
  };
}

export const serviceCatalogService = {
  listActiveOptions() {
    return serviceCatalogRepository.listActiveOptions();
  },

  async list(input: { search?: string; page?: string | number }) {
    const parsed = serviceCatalogListQuerySchema.parse(input);
    const total = await serviceCatalogRepository.count(parsed.search);
    const totalPages = Math.max(1, Math.ceil(total / SERVICES_PER_PAGE));
    const page = Math.min(parsed.page, totalPages);
    const services = await serviceCatalogRepository.list(
      parsed.search,
      (page - 1) * SERVICES_PER_PAGE,
      SERVICES_PER_PAGE,
    );

    return {
      services,
      search: parsed.search,
      page,
      total,
      totalPages,
    };
  },

  async getById(id: string) {
    const parsedId = serviceCatalogIdSchema.safeParse(id);
    return parsedId.success
      ? serviceCatalogRepository.findById(parsedId.data)
      : null;
  },

  create(input: ServiceCatalogFormInput) {
    const parsed = serviceCatalogFormSchema.parse(input);
    return serviceCatalogRepository.create(normalizeInput(parsed));
  },

  async update(id: string, input: ServiceCatalogFormInput) {
    const serviceId = serviceCatalogIdSchema.parse(id);
    const existing = await serviceCatalogRepository.findById(serviceId);

    if (!existing) {
      throw new ServiceCatalogServiceError("Serviço não encontrado.");
    }

    const parsed = serviceCatalogFormSchema.parse(input);
    return serviceCatalogRepository.update(serviceId, normalizeInput(parsed));
  },

  async setActive(id: string, isActive: boolean) {
    const serviceId = serviceCatalogIdSchema.parse(id);
    const existing = await serviceCatalogRepository.findById(serviceId);

    if (!existing) {
      throw new ServiceCatalogServiceError("Serviço não encontrado.");
    }

    return existing.isActive === isActive
      ? existing
      : serviceCatalogRepository.setActive(serviceId, isActive);
  },
};
