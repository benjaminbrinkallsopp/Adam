"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
  deathDate: string | null;
  gender: string | null;
  notes: string | null;
}

interface Relationship {
  id: string;
  parentId: string;
  childId: string;
}

export default function PersonDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const personId = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [relationDirection, setRelationDirection] = useState<"parent" | "child">("parent");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchData();
  }, [personId]);

  async function fetchData() {
    const [personRes, peopleRes, relsRes] = await Promise.all([
      fetch(`/api/people/${personId}`),
      fetch("/api/people"),
      fetch("/api/relationships"),
    ]);

    if (personRes.ok) setPerson(await personRes.json());
    if (peopleRes.ok) setAllPeople(await peopleRes.json());
    if (relsRes.ok) setRelationships(await relsRes.json());
  }

  const parents = relationships
    .filter((r) => r.childId === personId)
    .map((r) => allPeople.find((p) => p.id === r.parentId))
    .filter(Boolean) as Person[];

  const children = relationships
    .filter((r) => r.parentId === personId)
    .map((r) => allPeople.find((p) => p.id === r.childId))
    .filter(Boolean) as Person[];

  const existingRelatedIds = new Set([
    personId,
    ...parents.map((p) => p.id),
    ...children.map((c) => c.id),
  ]);

  const availablePeople = allPeople.filter((p) => !existingRelatedIds.has(p.id));

  async function addRelation() {
    if (!selectedPersonId) return;

    const body =
      relationDirection === "parent"
        ? { parentId: selectedPersonId, childId: personId }
        : { parentId: personId, childId: selectedPersonId };

    const res = await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSelectedPersonId("");
      fetchData();
    }
  }

  async function removeRelation(relId: string) {
    const res = await fetch(`/api/relationships?id=${relId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  }

  if (status === "loading" || !person) {
    return <div className="p-8 text-center">Indlæser...</div>;
  }

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link href="/people" className="text-blue-600 hover:text-blue-800 text-sm">
        &larr; Tilbage til personer
      </Link>

      <h1 className="text-3xl font-bold mt-4">
        {person.firstName} {person.lastName}
      </h1>

      {person.birthDate && (
        <p className="text-gray-500 mt-1">
          Født: {person.birthDate}
          {person.deathDate && ` — Død: ${person.deathDate}`}
        </p>
      )}

      {person.notes && <p className="mt-2 text-gray-600">{person.notes}</p>}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Forældre */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Forældre</h2>
          {parents.length === 0 ? (
            <p className="text-gray-500">Ingen forældre registreret</p>
          ) : (
            <ul className="space-y-2">
              {parents.map((parent) => {
                const rel = relationships.find(
                  (r) => r.parentId === parent.id && r.childId === personId
                );
                return (
                  <li key={parent.id} className="flex justify-between items-center">
                    <Link
                      href={`/people/${parent.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {parent.firstName} {parent.lastName}
                    </Link>
                    {rel && (
                      <button
                        onClick={() => removeRelation(rel.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Fjern
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Børn */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Børn</h2>
          {children.length === 0 ? (
            <p className="text-gray-500">Ingen børn registreret</p>
          ) : (
            <ul className="space-y-2">
              {children.map((child) => {
                const rel = relationships.find(
                  (r) => r.parentId === personId && r.childId === child.id
                );
                return (
                  <li key={child.id} className="flex justify-between items-center">
                    <Link
                      href={`/people/${child.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {child.firstName} {child.lastName}
                    </Link>
                    {rel && (
                      <button
                        onClick={() => removeRelation(rel.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Fjern
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Tilføj relation */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tilføj relation</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Relationstype</label>
            <select
              value={relationDirection}
              onChange={(e) => setRelationDirection(e.target.value as "parent" | "child")}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="parent">Tilføj forælder</option>
              <option value="child">Tilføj barn</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Person</label>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Vælg person...</option>
              {availablePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={addRelation}
            disabled={!selectedPersonId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Tilføj
          </button>
        </div>
      </div>
    </div>
  );
}
