import "server-only";

import { customerRepository } from "@/repositories/customer.repository";
import {
  equipmentRepository,
  type EquipmentPersistenceInput,
} from "@/repositories/equipment.repository";
import {
  equipmentFormSchema,
  equipmentIdSchema,
  equipmentListQuerySchema,
  type EquipmentFormField,
  type EquipmentFormInput,
} from "@/schemas/equipment.schema";

const EQUIPMENT_PER_PAGE = 10;

export class EquipmentServiceError extends Error {
  constructor(
    message: string,
    readonly field?: EquipmentFormField,
  ) {
    super(message);
    this.name = "EquipmentServiceError";
  }
}

function nullable(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

function normalizeEquipmentInput(
  input: EquipmentFormInput,
): EquipmentPersistenceInput {
  return {
    customerId: input.customerId,
    type: input.type,
    brand: nullable(input.brand),
    model: nullable(input.model),
    serialNumber: nullable(input.serialNumber),
    color: nullable(input.color),
    specifications: nullable(input.specifications),
    notes: nullable(input.notes),
  };
}

async function ensureCustomerIsAvailable(
  customerId: string,
  currentCustomerId?: string,
) {
  const customer = await customerRepository.findById(customerId);

  if (!customer) {
    throw new EquipmentServiceError(
      "O cliente selecionado não foi encontrado.",
      "customerId",
    );
  }

  if (!customer.isActive && customer.id !== currentCustomerId) {
    throw new EquipmentServiceError(
      "Selecione um cliente ativo para vincular o equipamento.",
      "customerId",
    );
  }

  return customer;
}

export const equipmentService = {
  listOptions() {
    return equipmentRepository.listOptions();
  },

  async list(input: {
    search?: string;
    customerId?: string;
    type?: string;
    page?: string | number;
  }) {
    const parsed = equipmentListQuerySchema.parse(input);
    const filters = {
      search: parsed.search,
      customerId: parsed.customerId,
      type: parsed.type,
    };
    const total = await equipmentRepository.count(filters);
    const totalPages = Math.max(1, Math.ceil(total / EQUIPMENT_PER_PAGE));
    const page = Math.min(parsed.page, totalPages);
    const equipment = await equipmentRepository.list(
      filters,
      (page - 1) * EQUIPMENT_PER_PAGE,
      EQUIPMENT_PER_PAGE,
    );

    return {
      equipment,
      ...filters,
      page,
      total,
      totalPages,
    };
  },

  async getById(id: string) {
    const equipmentId = equipmentIdSchema.safeParse(id);

    if (!equipmentId.success) {
      return null;
    }

    return equipmentRepository.findById(equipmentId.data);
  },

  async create(input: EquipmentFormInput) {
    const parsed = equipmentFormSchema.parse(input);
    await ensureCustomerIsAvailable(parsed.customerId);
    return equipmentRepository.create(normalizeEquipmentInput(parsed));
  },

  async update(id: string, input: EquipmentFormInput) {
    const equipmentId = equipmentIdSchema.parse(id);
    const currentEquipment = await equipmentRepository.findById(equipmentId);

    if (!currentEquipment) {
      throw new EquipmentServiceError("Equipamento não encontrado.");
    }

    const parsed = equipmentFormSchema.parse(input);
    await ensureCustomerIsAvailable(
      parsed.customerId,
      currentEquipment.customer.id,
    );
    const equipment = await equipmentRepository.update(
      equipmentId,
      normalizeEquipmentInput(parsed),
    );

    return {
      equipment,
      previousCustomerId: currentEquipment.customer.id,
    };
  },

  async setActive(id: string, isActive: boolean) {
    const equipmentId = equipmentIdSchema.parse(id);
    const currentEquipment = await equipmentRepository.findById(equipmentId);

    if (!currentEquipment) {
      throw new EquipmentServiceError("Equipamento não encontrado.");
    }

    if (currentEquipment.isActive === isActive) {
      return currentEquipment;
    }

    if (isActive) {
      await ensureCustomerIsAvailable(currentEquipment.customer.id);
    }

    return equipmentRepository.setActive(equipmentId, isActive);
  },
};
