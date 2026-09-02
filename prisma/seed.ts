import { PrismaClient } from "@prisma/client";
import { INTERVENTIONS } from "../src/domain/interventions/catalog";

const prisma = new PrismaClient();

async function main() {
  await prisma.protocolVersion.upsert({
    where: { semanticVersion: "2.0" },
    update: {},
    create: {
      semanticVersion: "2.0",
      sourceHash: "68a65458a36345a6222ee151de51306697f0d8227e6bd1cfe2ef29fff8804e03",
      status: "DEPLOYED",
      changelog: "Versión normativa inicial íntegra."
    }
  });
  for (const intervention of INTERVENTIONS) {
    await prisma.interventionDefinition.upsert({
      where: { stableKey: intervention.id },
      update: {
        category: intervention.category,
        contentTemplate: intervention.text,
        constraints: intervention.constraints,
        protocolVersion: "2.0"
      },
      create: {
        stableKey: intervention.id,
        category: intervention.category,
        contentTemplate: intervention.text,
        constraints: intervention.constraints,
        protocolVersion: "2.0"
      }
    });
  }
}

main().finally(() => prisma.$disconnect());
