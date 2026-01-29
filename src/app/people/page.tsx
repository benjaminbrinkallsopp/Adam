"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function PeoplePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    deathDate: "",
    gender: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchPeople();
  }, []);

  async function fetchPeople() {
    const res = await fetch("/api/people");
    if (res.ok) {
      setPeople(await res.json());
    }
  }

  function resetForm() {
    setForm({ firstName: "", lastName: "", birthDate: "", deathDate: "", gender: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(person: Person) {
    setForm({
      firstName: person.firstName,
      lastName: person.lastName || "",
      birthDate: person.birthDate || "",
      deathDate: person.deathDate || "",
      gender: person.gender || "",
      notes: person.notes || "",
    });
    setEditingId(person.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingId ? `/api/people/${editingId}` : "/api/people";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      resetForm();
      fetchPeople();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Er du sikker på du vil slette denne person?")) return;

    const res = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchPeople();
    }
  }

  if (status === "loading") {
    return <div className="p-8 text-center">Indlæser...</div>;
  }

  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Personer</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Tilføj person
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-8 space-y-4">
          <h2 className="text-xl font-semibold">
            {editingId ? "Redigér person" : "Ny person"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fornavn *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Efternavn</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fødselsdato</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dødsdato</label>
              <input
                type="date"
                value={form.deathDate}
                onChange={(e) => setForm({ ...form, deathDate: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Køn</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Vælg...</option>
                <option value="male">Mand</option>
                <option value="female">Kvinde</option>
                <option value="other">Omvendt Netto Pose</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Noter</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingId ? "Gem ændringer" : "Tilføj"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Annullér
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow">
        {people.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">
            Ingen personer tilføjet endnu. Klik &quot;Tilføj person&quot; for at starte.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {people.map((person) => (
              <li key={person.id} className="p-4 flex justify-between items-center">
                <div>
                  <Link href={`/people/${person.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                    {person.firstName} {person.lastName}
                  </Link>
                  {person.birthDate && (
                    <p className="text-sm text-gray-500">
                      Født: {person.birthDate}
                      {person.deathDate && ` — Død: ${person.deathDate}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(person)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Redigér
                  </button>
                  <button
                    onClick={() => handleDelete(person.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Slet
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
