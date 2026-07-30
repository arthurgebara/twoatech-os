import "server-only";

import {
  customerFormSchema,
  customerIdSchema,
  customerListQuerySchema,
  onlyDigits,
  type CustomerFormField,
  type CustomerFormInput,
} from "@/schemas/customer.schema";
import {
  customerRepository,
  type CustomerPersistenceInput,
} from "@/repositories/customer.repository";

const CUSTOMERS_PER_PAGE = 10;

export class CustomerServiceError extends Error {
  constructor(
    message: string,
    readonly field?: CustomerFormField,
  ) {
    super(message);
    this.name = "CustomerServiceError";
  }
}

function nullable(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

function normalizeCustomerInput(
  input: CustomerFormInput,
): CustomerPersistenceInput {
  return {
    name: input.name.trim(),
    document: nullable(onlyDigits(input.document)),
    email: nullable(input.email.toLowerCase()),
    phone: onlyDigits(input.phone),
    secondaryPhone: nullable(onlyDigits(input.secondaryPhone)),
    address: nullable(input.address),
    notes: nullable(input.notes),
  };
}

async function ensureDocumentIsAvailable(
  document: string | null,
  currentCustomerId?: string,
) {
  if (!document) {
    return;
  }

  const existingCustomer = await customerRepository.findByDocument(document);

  if (existingCustomer && existingCustomer.id !== currentCustomerId) {
    throw new CustomerServiceError(
      "Já existe um cliente cadastrado com este CPF ou CNPJ.",
      "document",
    );
  }
}

function isUniqueConstraintError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  return (error as { code?: unknown }).code === "P2002";
}

export const customerService = {
  listOptions() {
    return customerRepository.listOptions();
  },

  async list(input: { search?: string; page?: string | number }) {
    const parsed = customerListQuerySchema.parse(input);
    const total = await customerRepository.count(parsed.search);
    const totalPages = Math.max(1, Math.ceil(total / CUSTOMERS_PER_PAGE));
    const page = Math.min(parsed.page, totalPages);
    const customers = await customerRepository.list(
      parsed.search,
      (page - 1) * CUSTOMERS_PER_PAGE,
      CUSTOMERS_PER_PAGE,
    );

    return {
      customers,
      search: parsed.search,
      page,
      total,
      totalPages,
    };
  },

  async getById(id: string) {
    const customerId = customerIdSchema.safeParse(id);

    if (!customerId.success) {
      return null;
    }

    return customerRepository.findById(customerId.data);
  },

  async create(input: CustomerFormInput) {
    const parsed = customerFormSchema.parse(input);
    const data = normalizeCustomerInput(parsed);
    await ensureDocumentIsAvailable(data.document);

    try {
      return await customerRepository.create(data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new CustomerServiceError(
          "Já existe um cliente cadastrado com este CPF ou CNPJ.",
          "document",
        );
      }

      throw error;
    }
  },

  async update(id: string, input: CustomerFormInput) {
    const customerId = customerIdSchema.parse(id);
    const currentCustomer = await customerRepository.findById(customerId);

    if (!currentCustomer) {
      throw new CustomerServiceError("Cliente não encontrado.");
    }

    const parsed = customerFormSchema.parse(input);
    const data = normalizeCustomerInput(parsed);
    await ensureDocumentIsAvailable(data.document, customerId);

    try {
      return await customerRepository.update(customerId, data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new CustomerServiceError(
          "Já existe um cliente cadastrado com este CPF ou CNPJ.",
          "document",
        );
      }

      throw error;
    }
  },

  async setActive(id: string, isActive: boolean) {
    const customerId = customerIdSchema.parse(id);
    const currentCustomer = await customerRepository.findById(customerId);

    if (!currentCustomer) {
      throw new CustomerServiceError("Cliente não encontrado.");
    }

    if (currentCustomer.isActive === isActive) {
      return currentCustomer;
    }

    return customerRepository.setActive(customerId, isActive);
  },
};
