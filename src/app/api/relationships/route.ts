import { db } from "@/db";
import { relationships } from "@/db/schema";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const allRelationships = await db.select().from(relationships);
  return NextResponse.json(allRelationships);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  const { parentId, childId } = await request.json();

  if (!parentId || !childId) {
    return NextResponse.json(
      { error: "Forælder og barn er påkrævet" },
      { status: 400 }
    );
  }

  if (parentId === childId) {
    return NextResponse.json(
      { error: "En person kan ikke være sin egen forælder" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = await db.query.relationships.findFirst({
    where: and(
      eq(relationships.parentId, parentId),
      eq(relationships.childId, childId)
    ),
  });

  if (existing) {
    return NextResponse.json(
      { error: "Denne relation findes allerede" },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();

  const newRelationship = await db
    .insert(relationships)
    .values({
      id,
      parentId,
      childId,
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(newRelationship[0], { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID er påkrævet" }, { status: 400 });
  }

  const deleted = await db
    .delete(relationships)
    .where(eq(relationships.id, id))
    .returning();

  if (!deleted.length) {
    return NextResponse.json({ error: "Relation ikke fundet" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
