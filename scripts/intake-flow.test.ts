/** Integration test against a disposable, local PostgreSQL database only.
 * Run: node --conditions=react-server --import tsx scripts/intake-flow.test.ts
 * INTAKE_TEST_DATABASE_URL must target localhost and a database ending in _test.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Client } from "pg";

async function main() {
  const connectionString = process.env.INTAKE_TEST_DATABASE_URL;
  assert.ok(connectionString, "Set INTAKE_TEST_DATABASE_URL to a disposable local database.");
  const url = new URL(connectionString);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname.endsWith("_test"), "Only a local *_test database is allowed.");
  const schema = `intake_test_${randomUUID().replaceAll("-", "")}`;
  const sql = new Client({ connectionString });
  await sql.connect();
  await sql.query(`CREATE SCHEMA "${schema}"`);
  await sql.query(`SET search_path TO "${schema}"`);
  let prisma: typeof import("../src/lib/prisma").prisma | undefined;
  try {
    const migrations = (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort();
    for (const name of migrations.slice(0, -1)) await sql.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
    const userId = randomUUID(), customerId = randomUUID(), equipmentId = randomUUID();
    const oldOrderId = randomUUID(), oldQuoteId = randomUUID(), oldEventId = randomUUID();
    await sql.query('INSERT INTO users (id,name,email,"passwordHash","updatedAt") VALUES ($1,$2,$3,$4,now())', [userId, "Teste isolado", `${userId}@example.test`, "test-only"]);
    await sql.query('INSERT INTO customers (id,name,phone,"updatedAt") VALUES ($1,$2,$3,now())', [customerId, "Cliente de teste", "11999990000"]);
    await sql.query('INSERT INTO equipment (id,"customerId",type,"updatedAt") VALUES ($1,$2,$3,now())', [equipmentId, customerId, "NOTEBOOK"]);
    await sql.query('INSERT INTO service_orders (id,"customerId","equipmentId",status,"reportedProblem","createdById","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,now())', [oldOrderId, customerId, equipmentId, "OPEN", "Registro legado", userId]);
    await sql.query('INSERT INTO service_order_timeline_events (id,"serviceOrderId",type,title,"idempotencyKey") VALUES ($1,$2,$3,$4,$5)', [oldEventId, oldOrderId, "ORDEM_CRIADA", "Histórico original", "original"]);
    await sql.query('INSERT INTO quotes (id,"seriesId","customerId","equipmentId",status,"reportedProblem","createdById","updatedAt") VALUES ($1,$1,$2,$3,$4,$5,$6,now())', [oldQuoteId, customerId, equipmentId, "SENT", "Orçamento enviado antes da migração", userId]);
    const before = (await sql.query('SELECT * FROM service_order_timeline_events WHERE id=$1', [oldEventId])).rows[0];
    await sql.query(await readFile(`prisma/migrations/${migrations.at(-1)}/migration.sql`, "utf8"));
    assert.deepEqual((await sql.query('SELECT * FROM service_order_timeline_events WHERE id=$1', [oldEventId])).rows[0], before);
    assert.equal((await sql.query('SELECT "isIntake" FROM service_orders WHERE id=$1', [oldOrderId])).rows[0].isIntake, false);
    assert.equal((await sql.query('SELECT kind FROM quotes WHERE id=$1', [oldQuoteId])).rows[0].kind, "LEGACY");
    console.log("PASS: migration preserves existing orders, sent quote and immutable timeline");

    process.env.DATABASE_URL = url.toString();
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("../src/generated/prisma/client");
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }, { schema }) });
    (globalThis as typeof globalThis & { prisma: typeof prisma }).prisma = prisma;
    const { serviceOrderService } = await import("../src/services/service-order.service");
    const { entryChecklistService } = await import("../src/services/entry-checklist.service");
    const { diagnosticService } = await import("../src/services/diagnostic.service");
    const { quoteService } = await import("../src/services/quote.service");
    const { serviceExecutionService } = await import("../src/services/service-execution.service");
    const { serviceReportService } = await import("../src/services/service-report.service");
    const { exitChecklistService } = await import("../src/services/exit-checklist.service");
    const { deliveryService } = await import("../src/services/delivery.service");
    const { createEmptyEntryChecklistItems } = await import("../src/schemas/entry-checklist.schema");
    const { createEmptyExitChecklistItems } = await import("../src/schemas/exit-checklist.schema");
    const { pdfDocumentService } = await import("../src/services/pdf-document.service");
    const { createQuoteSchema } = await import("../src/schemas/quote.schema");
    const base = { customerId, equipmentId, reportedProblem: "Notebook não inicializa", receivedAccessories: "Carregador", generalNotes: "" };
    const quoteInput = { ...base, idempotencyKey: randomUUID(), validUntil: "", notes: "", discount: "0", items: [{ type: "PART" as const, serviceCatalogItemId: "", description: "SSD 500 GB", quantity: "1", unitPrice: "250,00" }] };
    const command = (serviceOrderId: string) => ({ serviceOrderId, idempotencyKey: randomUUID() });
    const order = await serviceOrderService.create({ ...base, idempotencyKey: randomUUID() }, userId);
    assert.equal(order.isIntake, true);
    assert.equal(order.status, "OPEN");
    await assert.rejects(quoteService.create({ ...quoteInput, serviceOrderId: order.id }, userId), /entrada e o diagnóstico/);
    await assert.rejects(diagnosticService.save({ ...command(order.id), description: "SSD danificado", technicalConclusion: "Troca do SSD", recommendations: "" }, userId), /diagnóstico não pode/);
    const entry = { ...command(order.id), notes: "Marcas na tampa", complete: true, items: createEmptyEntryChecklistItems() };
    await entryChecklistService.save(entry, userId);
    await entryChecklistService.save(entry, userId);
    await assert.rejects(quoteService.create({ ...quoteInput, serviceOrderId: order.id }, userId), /entrada e o diagnóstico/);
    const diagnostic = await diagnosticService.save({ ...command(order.id), description: "SSD danificado", technicalConclusion: "Troca do SSD", recommendations: "Backup" }, userId);
    assert.equal(diagnostic.status, "DIAGNOSING");
    await assert.rejects(serviceExecutionService.execute(command(order.id), userId, "START"));
    console.log("PASS: entry and diagnosis required before definitive quote; execution blocked");

    const photo = await prisma.checklistAttachment.create({ data: { serviceOrderId: order.id, checklistType: "ENTRY", bucket: "test", objectPath: randomUUID(), originalName: "ssd.jpg", mimeType: "image/jpeg", size: 100, uploadedById: userId, uploadedAt: new Date() } });
    const foreignPhoto = await prisma.checklistAttachment.create({ data: { serviceOrderId: oldOrderId, checklistType: "ENTRY", bucket: "test", objectPath: randomUUID(), originalName: "private.jpg", mimeType: "image/jpeg", size: 100, uploadedById: userId, uploadedAt: new Date() } });
    await assert.rejects(quoteService.create({ ...quoteInput, serviceOrderId: order.id, evidenceIds: [foreignPhoto.id] }, userId), /somente fotos/);
    assert.equal(createQuoteSchema.safeParse({ ...quoteInput, evidenceIds: Array.from({ length: 7 }, () => randomUUID()) }).success, false);
    const first = await quoteService.create({ ...quoteInput, serviceOrderId: order.id, evidenceIds: [photo.id] }, userId);
    assert.equal(first.kind, "DEFINITIVE");
    assert.equal(first.evidence[0].attachmentId, photo.id);
    await assert.rejects(quoteService.create({ ...quoteInput, idempotencyKey: randomUUID(), serviceOrderId: order.id }, userId), /já possui/);
    await quoteService.send({ quoteId: first.id, idempotencyKey: randomUUID() }, userId);
    await quoteService.reject({ quoteId: first.id, idempotencyKey: randomUUID() }, userId);
    assert.equal((await serviceOrderService.getById(order.id))?.isIntake, true);
    const revised = await quoteService.create({ ...quoteInput, idempotencyKey: randomUUID(), revisionOfQuoteId: first.id, evidenceIds: [] }, userId);
    assert.equal(revised.version, 2);
    assert.equal(revised.evidence.length, 0);
    await quoteService.send({ quoteId: revised.id, idempotencyKey: randomUUID() }, userId);
    const approval = { quoteId: revised.id, idempotencyKey: randomUUID() };
    await quoteService.approve(approval, userId);
    await quoteService.approve(approval, userId);
    const converted = await serviceOrderService.getById(order.id);
    assert.equal(converted?.isIntake, false);
    assert.equal(converted?.number, order.number);
    assert.ok(converted?.convertedAt);
    assert.equal(converted?.timeline.filter((event) => event.type === "ATENDIMENTO_CONVERTIDO").length, 1);
    assert.equal((await entryChecklistService.getForServiceOrder(order.id))?.status, "COMPLETED");
    assert.equal(await prisma.serviceOrder.count(), 2);
    console.log("PASS: photo ownership, quote rejection/revision, approval conversion and replay without duplicate OS");

    await serviceExecutionService.execute(command(order.id), userId, "START");
    await serviceReportService.save({ ...command(order.id), workPerformed: "Substituição do SSD e instalação do sistema", partsUsed: "SSD", testsPerformed: "Inicialização normal", notes: "" }, userId);
    await exitChecklistService.save({ ...command(order.id), notes: "", complete: true, items: createEmptyExitChecklistItems().map((item) => ({ ...item, checked: true })) }, userId);
    await deliveryService.markReady(command(order.id), userId);
    await deliveryService.deliver(command(order.id), userId);
    assert.equal((await serviceOrderService.getById(order.id))?.status, "DELIVERED");
    console.log("PASS: approved OS executes, completes report, exit checklist and delivery");

    const estimate = await quoteService.create({ ...quoteInput, idempotencyKey: randomUUID() }, userId);
    assert.equal(estimate.kind, "ESTIMATE");
    await assert.rejects(quoteService.approve({ quoteId: estimate.id, idempotencyKey: randomUUID() }, userId), /estimativa/);
    await quoteService.send({ quoteId: estimate.id, idempotencyKey: randomUUID() }, userId);
    await assert.rejects(quoteService.approve({ quoteId: estimate.id, idempotencyKey: randomUUID() }, userId), /estimativa/);
    const dto = await pdfDocumentService.getQuote(estimate.id);
    assert.equal(dto?.kind, "ESTIMATE");
    assert.equal(dto?.evidence.length, 0);
    const oldApproval = await quoteService.approve({ quoteId: oldQuoteId, idempotencyKey: randomUUID() }, userId);
    assert.equal(oldApproval.status, "APPROVED");
    assert.equal(oldApproval.serviceOrder?.status, "OPEN");
    assert.equal(oldApproval.serviceOrder?.isIntake, false);
    console.log("PASS: remote estimates cannot authorize service; pre-migration sent quote still approves");
    const directOrder = await serviceOrderService.create({ ...base, idempotencyKey: randomUUID() }, userId);
    await entryChecklistService.save({ ...entry, ...command(directOrder.id) }, userId);
    await diagnosticService.save({ ...command(directOrder.id), description: "SSD com defeito", technicalConclusion: "Troca do SSD", recommendations: "" }, userId);
    const directQuote = await quoteService.create({ ...quoteInput, idempotencyKey: randomUUID(), serviceOrderId: directOrder.id }, userId);
    const directApproval = { quoteId: directQuote.id, idempotencyKey: randomUUID() };
    const directlyApproved = await quoteService.approve(directApproval, userId);
    assert.equal(directlyApproved.status, "APPROVED");
    assert.equal(directlyApproved.sentAt, null);
    assert.equal(directlyApproved.sentIdempotencyKey, null);
    assert.equal(directlyApproved.serviceOrder?.status, "APPROVED");
    assert.equal(directlyApproved.serviceOrder?.isIntake, false);
    await quoteService.approve(directApproval, userId);
    const directTimeline = (await serviceOrderService.getById(directOrder.id))!.timeline;
    assert.equal(directTimeline.filter((event) => event.type === "ORCAMENTO_ENVIADO").length, 0);
    assert.equal(directTimeline.filter((event) => event.type === "ATENDIMENTO_CONVERTIDO").length, 1);
    assert.ok(directTimeline.find((event) => event.type === "ORCAMENTO_APROVADO")?.description?.includes("sem envio"));
    await serviceExecutionService.execute(command(directOrder.id), userId, "START");
    console.log("PASS: draft approves directly without sent status, converts only once and authorizes execution");
    await assert.rejects(sql.query('UPDATE service_order_timeline_events SET title=$1 WHERE id=$2', ["Alterado", oldEventId]), /immut|imut|append|alter|permit|update/i);
    console.log("PASS: append-only timeline protection survives migration");
  } finally {
    await prisma?.$disconnect();
    await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
    await sql.end();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
